import { NextRequest, NextResponse } from "next/server";
import { appOrigin, exchangeCodeForTokens } from "@/lib/spotify";
import { generateSid, saveSession } from "@/lib/kv";
import { STATE_COOKIE } from "../login/route";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const origin = appOrigin();
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");
  const expectedState = request.cookies.get(STATE_COOKIE)?.value;

  const redirectWithError = (reason: string) => {
    const response = NextResponse.redirect(`${origin}/?error=${encodeURIComponent(reason)}`);
    response.cookies.delete(STATE_COOKIE);
    return response;
  };

  if (error) {
    return redirectWithError(error);
  }

  if (!code || !state || !expectedState || state !== expectedState) {
    return redirectWithError("invalid_state");
  }

  let tokens;
  try {
    tokens = await exchangeCodeForTokens(code);
  } catch (err) {
    console.error("Failed to exchange Spotify authorization code:", err);
    return redirectWithError("token_exchange_failed");
  }

  if (!tokens.refresh_token) {
    console.error("Spotify did not return a refresh_token on the initial exchange");
    return redirectWithError("token_exchange_failed");
  }

  const sid = generateSid();
  try {
    await saveSession(sid, {
      refreshToken: tokens.refresh_token,
      accessToken: tokens.access_token,
      accessTokenExpiresAt: Date.now() + tokens.expires_in * 1000,
      createdAt: Date.now(),
    });
  } catch (err) {
    console.error("Failed to persist widget session:", err);
    return redirectWithError("session_store_failed");
  }

  const response = NextResponse.redirect(`${origin}/?sid=${sid}`);
  response.cookies.delete(STATE_COOKIE);
  return response;
}
