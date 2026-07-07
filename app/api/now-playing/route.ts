import { NextRequest, NextResponse } from "next/server";
import { fetchCurrentlyPlaying, normalizeNowPlaying, refreshAccessToken } from "@/lib/spotify";
import { getSession, updateSession } from "@/lib/kv";
import type { Session } from "@/lib/types";

// Refresh a little before actual expiry so we don't race Spotify.
const EXPIRY_BUFFER_MS = 60 * 1000;

/**
 * Proxies Spotify's "currently playing" endpoint for a given widget session.
 * The browser only ever sends `sid` — the refresh token and access token
 * never leave the server.
 */
export async function GET(request: NextRequest) {
  const sid = request.nextUrl.searchParams.get("sid");
  if (!sid) {
    return NextResponse.json({ error: "Missing sid" }, { status: 400 });
  }

  try {
    const session = await getSession(sid);
    if (!session) {
      return NextResponse.json({ error: "Unknown sid" }, { status: 404 });
    }

    const accessToken = await getValidAccessToken(sid, session);
    const data = await fetchCurrentlyPlaying(accessToken);
    return NextResponse.json(normalizeNowPlaying(data));
  } catch (err) {
    console.error("Failed to fetch now playing:", err);
    return NextResponse.json({ error: "Failed to fetch now playing" }, { status: 502 });
  }
}

async function getValidAccessToken(sid: string, session: Session): Promise<string> {
  const isExpired =
    !session.accessToken ||
    !session.accessTokenExpiresAt ||
    session.accessTokenExpiresAt - EXPIRY_BUFFER_MS < Date.now();

  if (!isExpired) {
    return session.accessToken as string;
  }

  const tokens = await refreshAccessToken(session.refreshToken);
  const updated = await updateSession(sid, {
    accessToken: tokens.access_token,
    accessTokenExpiresAt: Date.now() + tokens.expires_in * 1000,
    // Spotify occasionally rotates the refresh token; persist it if so.
    refreshToken: tokens.refresh_token ?? session.refreshToken,
  });

  return updated.accessToken as string;
}
