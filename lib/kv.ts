import "server-only";
import { randomBytes } from "node:crypto";
import { Redis } from "@upstash/redis";
import type { Session } from "./types";

// Reads UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN from the environment.
// (These are the env vars the Vercel Upstash/KV integration provisions.)
const redis = Redis.fromEnv();

const SESSION_PREFIX = "spotify-widget:session:";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 365;

export function generateSid(): string {
  return randomBytes(24).toString("base64url");
}

export async function getSession(sid: string): Promise<Session | null> {
  return redis.get<Session>(SESSION_PREFIX + sid);
}

export async function saveSession(sid: string, session: Session): Promise<void> {
  await redis.set(SESSION_PREFIX + sid, session, { ex: SESSION_TTL_SECONDS });
}

/** Merges a partial update (e.g. a refreshed access token) into an existing session. */
export async function updateSession(sid: string, patch: Partial<Session>): Promise<Session> {
  const existing = await getSession(sid);
  if (!existing) {
    throw new Error(`No session found for sid: ${sid}`);
  }
  const updated = { ...existing, ...patch };
  await saveSession(sid, updated);
  return updated;
}
