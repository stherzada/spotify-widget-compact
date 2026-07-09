"use client";

import { useEffect, useState } from "react";
import type { NowPlaying } from "@/lib/types";

const TICK_MS = 250;

/**
 * Interpolates playback progress between polls of `/api/now-playing`, so the
 * progress bar advances smoothly even though we only poll Spotify every few
 * seconds (see `useNowPlaying`). Resyncs to the server-reported value on
 * every new poll result, and otherwise advances locally by `TICK_MS` on a
 * timer between polls.
 */
export function useTrackProgress(nowPlaying: NowPlaying | null): number {
  const [progressMs, setProgressMs] = useState(nowPlaying?.progressMs ?? 0);
  const [prevNowPlaying, setPrevNowPlaying] = useState(nowPlaying);

  // "Adjusting state when a prop changes" — done during render (same
  // pattern as useCrossfade in hooks/useCrossfade.ts), so the resync happens
  // on the same commit a fresh poll result arrives rather than one render
  // later via an effect.
  if (nowPlaying !== prevNowPlaying) {
    setPrevNowPlaying(nowPlaying);
    setProgressMs(nowPlaying?.progressMs ?? 0);
  }

  useEffect(() => {
    if (!nowPlaying?.isPlaying) return;
    const durationMs = nowPlaying.durationMs;

    const interval = setInterval(() => {
      setProgressMs((prev) => Math.min(prev + TICK_MS, durationMs));
    }, TICK_MS);

    return () => clearInterval(interval);
  }, [nowPlaying?.isPlaying, nowPlaying?.durationMs]);

  return progressMs;
}
