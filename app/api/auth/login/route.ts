import { randomBytes } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { buildAuthorizeUrl } from "@/lib/spotify";

export const STATE_COOKIE = "spotify_oauth_state";

/** Kicks off the OAuth flow: redirects to Spotify's authorize screen. */
export async function GET(request: NextRequest) {
  // A random, single-use value we can check for on the way back from Spotify
  // (CSRF protection for the redirect step).
  const state = randomBytes(16).toString("hex");

  const response = NextResponse.redirect(buildAuthorizeUrl(state));
  response.cookies.set(STATE_COOKIE, state, {
    httpOnly: true,
    secure: request.nextUrl.protocol === "https:",
    sameSite: "lax",
    maxAge: 60 * 10, // 10 minutes — just long enough to complete the redirect
    path: "/",
  });

  return response;
}
