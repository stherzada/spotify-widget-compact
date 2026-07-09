import "server-only";
import type {
  NowPlaying,
  SpotifyCurrentlyPlayingResponse,
  SpotifyTokenResponse,
} from "./types";

const AUTHORIZE_URL = "https://accounts.spotify.com/authorize";
const TOKEN_URL = "https://accounts.spotify.com/api/token";
const CURRENTLY_PLAYING_URL = "https://api.spotify.com/v1/me/player/currently-playing";

const SCOPES = [
  "user-read-private",
  "user-read-email",
  "user-modify-playback-state",
  "user-read-playback-position",
  "user-library-read",
  "streaming",
  "user-read-playback-state",
  "user-read-recently-played",
  "playlist-read-private",
].join(" ");

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function basicAuthHeader(): string {
  const clientId = requireEnv("SPOTIFY_CLIENT_ID");
  const clientSecret = requireEnv("SPOTIFY_CLIENT_SECRET");
  return `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`;
}

export function appOrigin(): string {
  return new URL(requireEnv("SPOTIFY_REDIRECT_URI")).origin;
}

export function buildAuthorizeUrl(state: string): string {
  const url = new URL(AUTHORIZE_URL);
  url.searchParams.set("client_id", requireEnv("SPOTIFY_CLIENT_ID"));
  url.searchParams.set("response_type", "code");
  url.searchParams.set("redirect_uri", requireEnv("SPOTIFY_REDIRECT_URI"));
  url.searchParams.set("show_dialog", "true");
  url.searchParams.set("scope", SCOPES);
  url.searchParams.set("state", state);
  return url.toString();
}

/** Exchanges a one-time authorization `code` for an access + refresh token pair. */
export async function exchangeCodeForTokens(code: string): Promise<SpotifyTokenResponse> {
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: requireEnv("SPOTIFY_REDIRECT_URI"),
  });

  const response = await fetch(TOKEN_URL, {
    method: "POST",
    headers: {
      Authorization: basicAuthHeader(),
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: body.toString(),
  });

  if (!response.ok) {
    throw new Error(`Failed to exchange authorization code: ${response.status}`);
  }

  return response.json();
}

/** Exchanges a long-lived refresh token for a fresh access token. */
export async function refreshAccessToken(refreshToken: string): Promise<SpotifyTokenResponse> {
  const body = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: refreshToken,
  });

  const response = await fetch(TOKEN_URL, {
    method: "POST",
    headers: {
      Authorization: basicAuthHeader(),
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: body.toString(),
  });

  if (!response.ok) {
    throw new Error(`Failed to refresh access token: ${response.status}`);
  }

  return response.json();
}

/**
 * Fetches what's currently playing. Returns `null` when Spotify has nothing
 * to report (204 No Content — e.g. no active device, or a private session).
 */
export async function fetchCurrentlyPlaying(
  accessToken: string
): Promise<SpotifyCurrentlyPlayingResponse | null> {
  const response = await fetch(CURRENTLY_PLAYING_URL, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (response.status === 204) {
    return null;
  }

  if (!response.ok) {
    throw new Error(`Failed to fetch currently playing: ${response.status}`);
  }

  return response.json();
}

const PLACEHOLDER_ALBUM_ART = "/placeholder-album-art.png";

/** Converts Spotify's raw response into the flat shape the widget UI renders. */
export function normalizeNowPlaying(
  data: SpotifyCurrentlyPlayingResponse | null
): NowPlaying {
  const track = data?.item ?? null;

  if (!track) {
    return {
      isPlaying: false,
      songUri: null,
      albumArt: PLACEHOLDER_ALBUM_ART,
      artist: "",
      name: "",
      durationMs: 0,
      progressMs: 0,
    };
  }

  return {
    isPlaying: data?.is_playing ?? false,
    songUri: track.uri,
    albumArt: track.album.images[0]?.url ?? PLACEHOLDER_ALBUM_ART,
    artist: track.artists.map((a) => a.name).join(", "),
    name: track.name,
    durationMs: track.duration_ms,
    progressMs: data?.progress_ms ?? 0,
  };
}
