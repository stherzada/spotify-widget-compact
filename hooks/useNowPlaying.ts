"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { NowPlaying } from "@/lib/types";

const POLL_INTERVAL_MS = 2000;
const TRACK_END_SETTLE_MS = 1000;
const MAX_BACKOFF_MS = 30000;
const REVEAL_DELAY_MS = 500;

function nextPollDelay(data: NowPlaying): number {
  if (!data.isPlaying) return POLL_INTERVAL_MS;
  const remaining = data.durationMs - data.progressMs;
  if (remaining <= 0) return POLL_INTERVAL_MS;
  return Math.min(POLL_INTERVAL_MS, remaining + TRACK_END_SETTLE_MS);
}

interface UseNowPlayingResult {
  nowPlaying: NowPlaying | null;
  visible: boolean;
  reveal: () => void;
}
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
    let inFlight = false;
    let pollTimeout: ReturnType<typeof setTimeout> | null = null;
    let revealTimeout: ReturnType<typeof setTimeout> | null = null;
    let backoffMs = POLL_INTERVAL_MS;

    function schedule(delay: number) {
      if (cancelled || document.hidden) return;
      pollTimeout = setTimeout(poll, delay);
    }

    async function poll() {
      pollTimeout = null;
      inFlight = true;
      try {
        const response = await fetch(`/api/now-playing?sid=${encodeURIComponent(sid)}`);
        if (!response.ok) throw new Error(`now-playing fetch failed: ${response.status}`);
        if (cancelled) return;

        const data: NowPlaying = await response.json();
        if (cancelled) return;

        setNowPlaying(data);
        backoffMs = POLL_INTERVAL_MS;

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

        schedule(nextPollDelay(data));
      } catch {
        backoffMs = Math.min(backoffMs * 2, MAX_BACKOFF_MS);
        schedule(backoffMs);
      } finally {
        inFlight = false;
      }
    }

    function handleVisibilityChange() {
      if (document.hidden) {
        if (pollTimeout) clearTimeout(pollTimeout);
        pollTimeout = null;
        return;
      }
      if (!pollTimeout && !inFlight) poll();
    }

    document.addEventListener("visibilitychange", handleVisibilityChange);
    poll();

    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      if (pollTimeout) clearTimeout(pollTimeout);
      if (revealTimeout) clearTimeout(revealTimeout);
      if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
    };
  }, [sid, reveal]);

  return { nowPlaying, visible, reveal };
}
