"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { NowPlaying } from "@/lib/types";

const POLL_INTERVAL_MS = 1000;
const REVEAL_DELAY_MS = 500;

interface UseNowPlayingResult {
  nowPlaying: NowPlaying | null;
  visible: boolean;
  reveal: () => void;
}

/**
 * Polls `/api/now-playing` for a given widget session and derives the
 * show/hide behavior: reveal on play or track change, hide on pause, and
 * auto-hide again after `visibilityDurationSeconds` if set.
 */
export function useNowPlaying(
  sid: string,
  visibilityDurationSeconds: number
): UseNowPlayingResult {
  const [nowPlaying, setNowPlaying] = useState<NowPlaying | null>(null);
  const [visible, setVisible] = useState(false);

  const hideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastIsPlayingRef = useRef(false);
  const lastSongUriRef = useRef<string | null>(null);

  const reveal = useCallback(() => {
    if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
    setVisible(true);
    if (visibilityDurationSeconds > 0) {
      hideTimeoutRef.current = setTimeout(
        () => setVisible(false),
        visibilityDurationSeconds * 1000
      );
    }
  }, [visibilityDurationSeconds]);

  useEffect(() => {
    let cancelled = false;
    let revealTimeout: ReturnType<typeof setTimeout> | null = null;

    async function poll() {
      try {
        const response = await fetch(`/api/now-playing?sid=${encodeURIComponent(sid)}`);
        if (!response.ok || cancelled) return;

        const data: NowPlaying = await response.json();
        if (cancelled) return;
        setNowPlaying(data);

        const playStateChanged = data.isPlaying !== lastIsPlayingRef.current;
        const trackChanged = data.songUri !== null && data.songUri !== lastSongUriRef.current;

        if (playStateChanged && !data.isPlaying) {
          if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
          setVisible(false);
        } else if (data.isPlaying && (playStateChanged || trackChanged)) {
          if (revealTimeout) clearTimeout(revealTimeout);
          revealTimeout = setTimeout(reveal, REVEAL_DELAY_MS);
        }

        lastIsPlayingRef.current = data.isPlaying;
        if (data.songUri) lastSongUriRef.current = data.songUri;
      } catch {
        // Network hiccup — just try again on the next tick.
      }
    }

    poll();
    const interval = setInterval(poll, POLL_INTERVAL_MS);

    return () => {
      cancelled = true;
      clearInterval(interval);
      if (revealTimeout) clearTimeout(revealTimeout);
      if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
    };
  }, [sid, reveal]);

  return { nowPlaying, visible, reveal };
}
