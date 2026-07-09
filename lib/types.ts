// Shape of the pieces of Spotify's API responses we actually use.
// See: https://developer.spotify.com/documentation/web-api/reference/get-the-users-currently-playing-track

export interface SpotifyImage {
  url: string;
  height: number | null;
  width: number | null;
}

export interface SpotifyArtist {
  name: string;
}

export interface SpotifyAlbum {
  images: SpotifyImage[];
}

export interface SpotifyTrackItem {
  uri: string;
  name: string;
  duration_ms: number;
  album: SpotifyAlbum;
  artists: SpotifyArtist[];
}

export interface SpotifyCurrentlyPlayingResponse {
  is_playing: boolean;
  progress_ms: number | null;
  // `item` is null when the user is playing a local file, a podcast episode
  // Spotify won't return metadata for, or nothing at all.
  item: SpotifyTrackItem | null;
}

export interface SpotifyTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token?: string;
  scope: string;
}

// What the widget actually renders. Normalized so the client never has to
// know about Spotify's response shape (or handle `item: null`).
export interface NowPlaying {
  isPlaying: boolean;
  songUri: string | null;
  albumArt: string;
  artist: string;
  name: string;
  durationMs: number;
  progressMs: number;
}

// What we persist server-side per widget, keyed by `sid`.
export interface Session {
  refreshToken: string;
  accessToken?: string;
  accessTokenExpiresAt?: number; // epoch ms
  createdAt: number; // epoch ms
}

// Non-secret display preferences, carried as query params on the widget URL.
export interface WidgetPrefs {
  twitchChannel: string;
  visibilityDurationSeconds: number;
  hideAlbumArt: boolean;
  glassEffect: boolean;
  accentColor: string;
  textColor: string;
}
