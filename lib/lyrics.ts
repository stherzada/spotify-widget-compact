import "server-only";
import { Client, parseLocalLyrics, type LyricLine as RawLyricLine } from "lrclib-api";
import { Redis } from "@upstash/redis";
import type { LyricLine } from "./types";

const client = new Client();
const redis = Redis.fromEnv();

const LYRICS_PREFIX = "spotify-widget:lyrics:";
const HIT_TTL_SECONDS = 60 * 60 * 24 * 30; // 30 days
const MISS_TTL_SECONDS = 60 * 60; // 1 hour
const MAX_MEMORY_ENTRIES = 500;

interface MemoryCacheEntry {
  lines: LyricLine[];
  expiresAt: number;
}

const memoryCache = new Map<string, MemoryCacheEntry>();

const inFlight = new Map<string, Promise<LyricLine[]>>();

function buildKey(track: string, artist: string, durationMs?: number): string {
  const normTrack = track.trim().toLowerCase();
  const normArtist = artist.trim().toLowerCase();
  const durationSec =
    durationMs && Number.isFinite(durationMs) && durationMs > 0
      ? String(Math.round(durationMs / 1000))
      : "unknown";
  return `${normTrack}|${normArtist}|${durationSec}`;
}

function readMemoryCache(key: string): LyricLine[] | undefined {
  const entry = memoryCache.get(key);
  if (!entry) return undefined;
  if (entry.expiresAt < Date.now()) {
    memoryCache.delete(key);
    return undefined;
  }
  return entry.lines;
}

function writeMemoryCache(key: string, lines: LyricLine[], ttlSeconds: number): void {
  if (memoryCache.size >= MAX_MEMORY_ENTRIES && !memoryCache.has(key)) {
    const oldestKey = memoryCache.keys().next().value;
    if (oldestKey !== undefined) memoryCache.delete(oldestKey);
  }
  memoryCache.set(key, { lines, expiresAt: Date.now() + ttlSeconds * 1000 });
}

function toWidgetLines(rawLines: RawLyricLine[] | null | undefined): LyricLine[] {
  return (rawLines ?? [])
    .filter((line): line is { text: string; startTime: number } => typeof line.startTime === "number")
    .map((line) => ({ text: line.text, startTimeMs: Math.round(line.startTime * 1000) }))
    .sort((a, b) => a.startTimeMs - b.startTimeMs);
}

async function fetchFromLrclib(track: string, artist: string, durationMs?: number): Promise<LyricLine[]> {
  const duration = durationMs && durationMs > 0 ? durationMs : undefined;

  try {
    const exact = await client.getSynced({ track_name: track, artist_name: artist, duration });
    const lines = toWidgetLines(exact);
    if (lines.length > 0) return lines;
  } catch (err) {
    console.error("Exact lyrics lookup failed:", err);
  }

  try {
    const results = await client.searchLyrics({ track_name: track, artist_name: artist, duration });
    for (const result of results) {
      if (!result.syncedLyrics) continue;
      const lines = toWidgetLines(parseLocalLyrics(result.syncedLyrics).synced);
      if (lines.length > 0) return lines;
    }
  } catch (err) {
    console.error("Fallback lyrics search failed:", err);
  }

  return [];
}

export async function getSyncedLyrics(
  track: string,
  artist: string,
  durationMs?: number
): Promise<LyricLine[]> {
  const key = buildKey(track, artist, durationMs);

  const cached = readMemoryCache(key);
  if (cached) return cached;

  const pending = inFlight.get(key);
  if (pending) return pending;

  const promise = (async () => {
    try {
      const redisHit = await redis.get<LyricLine[]>(LYRICS_PREFIX + key);
      if (redisHit) {
        const ttlSeconds = redisHit.length > 0 ? HIT_TTL_SECONDS : MISS_TTL_SECONDS;
        writeMemoryCache(key, redisHit, ttlSeconds);
        return redisHit;
      }
    } catch (err) {
      console.error("Redis lyrics lookup failed:", err);
    }

    const lines = await fetchFromLrclib(track, artist, durationMs);
    const ttlSeconds = lines.length > 0 ? HIT_TTL_SECONDS : MISS_TTL_SECONDS;

    try {
      await redis.set(LYRICS_PREFIX + key, lines, { ex: ttlSeconds });
    } catch (err) {
      console.error("Redis lyrics write failed:", err);
    }
    writeMemoryCache(key, lines, ttlSeconds);

    return lines;
  })();

  inFlight.set(key, promise);
  try {
    return await promise;
  } finally {
    inFlight.delete(key);
  }
}
