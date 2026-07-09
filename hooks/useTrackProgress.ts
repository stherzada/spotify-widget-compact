"use client";

import { useEffect, useState } from "react";
import type { NowPlaying } from "@/lib/types";

const TICK_MS = 250;


export function useTrackProgress(nowPlaying: NowPlaying | null): number {
  const [progressMs, setProgressMs] = useState(nowPlaying?.progressMs ?? 0);
  const [prevNowPlaying, setPrevNowPlaying] = useState(nowPlaying);

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
