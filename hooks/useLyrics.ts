"use client";

import { useEffect, useState } from "react";
import type { LyricLine, NowPlaying } from "@/lib/types";

interface UseLyricsResult {
  lines: LyricLine[] | null;
}

export function useLyrics(nowPlaying: NowPlaying | null, enabled: boolean): UseLyricsResult {
  const [lines, setLines] = useState<LyricLine[] | null>(null);

  const songUri = nowPlaying?.songUri ?? null;
  const name = nowPlaying?.name ?? "";
  const artist = nowPlaying?.artist ?? "";
  const durationMs = nowPlaying?.durationMs ?? 0;
  const active = enabled && !!songUri && !!name && !!artist;

  const key = active ? songUri : null;
  const [prevKey, setPrevKey] = useState(key);
  if (key !== prevKey) {
    setPrevKey(key);
    setLines(null);
  }

  useEffect(() => {
    if (!active) return;

    let cancelled = false;
    const params = new URLSearchParams({ track: name, artist });
    if (durationMs > 0) params.set("duration", String(durationMs));

    fetch(`/api/lyrics?${params.toString()}`)
      .then((response) => (response.ok ? response.json() : { lines: [] }))
      .then((data: { lines: LyricLine[] }) => {
        if (cancelled) return;
        setLines(Array.isArray(data.lines) ? data.lines : []);
      })
      .catch(() => {
        if (!cancelled) setLines([]);
      });

    return () => {
      cancelled = true;
    };
  }, [active, name, artist, durationMs]);

  return { lines };
}

/** Returns the active lyric line's text for the given playback position, or "" before the first line. */
export function activeLyricLine(lines: LyricLine[], progressMs: number): string {
  let active = "";
  for (const line of lines) {
    if (line.startTimeMs > progressMs) break;
    active = line.text;
  }
  return active;
}
