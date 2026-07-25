import "server-only";
import { randomBytes } from "node:crypto";
import { Redis } from "@upstash/redis";
import type { Session } from "./types";

const redis = Redis.fromEnv();

const SESSION_PREFIX = "spotify-widget:session:";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 365;
// Safe well beyond 60s: getValidAccessToken (app/api/now-playing/route.ts)
// checks the token's own expiry with a buffer before using it, so serving a
// cached session never risks handing out a stale access token.
const SESSION_CACHE_TTL_MS = 5 * 60 * 1000;
const sessionCache = new Map<string, { session: Session; expiresAt: number }>();

export function generateSid(): string {
  return randomBytes(24).toString("base64url");
}

export async function getSession(
  sid: string,
  { allowCache = false }: { allowCache?: boolean } = {}
): Promise<Session | null> {
  if (allowCache) {
    const cached = sessionCache.get(sid);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.session;
    }
  }

  const session = await redis.get<Session>(SESSION_PREFIX + sid);
  if (session) {
    sessionCache.set(sid, { session, expiresAt: Date.now() + SESSION_CACHE_TTL_MS });
  } else {
    sessionCache.delete(sid);
  }
  return session;
}

export async function saveSession(sid: string, session: Session): Promise<void> {
  await redis.set(SESSION_PREFIX + sid, session, { ex: SESSION_TTL_SECONDS });
  sessionCache.set(sid, { session, expiresAt: Date.now() + SESSION_CACHE_TTL_MS });
}

export async function updateSession(sid: string, patch: Partial<Session>): Promise<Session> {
  const existing = await getSession(sid);
  if (!existing) {
    throw new Error(`No session found for sid: ${sid}`);
  }
  const updated = { ...existing, ...patch };
  await saveSession(sid, updated);
  return updated;
}
