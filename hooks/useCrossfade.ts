"use client";

import { useEffect, useState } from "react";

/**
 * Delays swapping a displayed value until `delayMs` after it changes, and
 * reports whether a swap is pending — pair with a CSS opacity transition to
 * fade out the old value, swap it, then fade the new one in.
 */
export function useCrossfade<T>(value: T, delayMs = 500): { displayValue: T; fading: boolean } {
  const [displayValue, setDisplayValue] = useState(value);
  const [prevValue, setPrevValue] = useState(value);
  const [fading, setFading] = useState(false);

  // "Adjusting state when a prop changes" — done during render (not in an
  // effect) per https://react.dev/learn/you-might-not-need-an-effect, so the
  // fade-out starts on the same commit the new value arrives.
  if (value !== prevValue) {
    setPrevValue(value);
    setFading(true);
  }

  useEffect(() => {
    if (!fading) return;
    const timeout = setTimeout(() => {
      setDisplayValue(value);
      setFading(false);
    }, delayMs);
    return () => clearTimeout(timeout);
  }, [fading, value, delayMs]);

  return { displayValue, fading };
}

/** Same idea, but for a background layer that swaps a beat after the front one. */
export function useDelayedValue<T>(value: T, delayMs: number): T {
  const [delayed, setDelayed] = useState(value);

  useEffect(() => {
    const timeout = setTimeout(() => setDelayed(value), delayMs);
    return () => clearTimeout(timeout);
  }, [value, delayMs]);

  return delayed;
}
