"use client";

import { useEffect, useState } from "react";

export function useCrossfade<T>(value: T, delayMs = 500): { displayValue: T; fading: boolean } {
  const [displayValue, setDisplayValue] = useState(value);
  const [prevValue, setPrevValue] = useState(value);
  const [fading, setFading] = useState(false);

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

export function useDelayedValue<T>(value: T, delayMs: number): T {
  const [delayed, setDelayed] = useState(value);

  useEffect(() => {
    const timeout = setTimeout(() => setDelayed(value), delayMs);
    return () => clearTimeout(timeout);
  }, [value, delayMs]);

  return delayed;
}
