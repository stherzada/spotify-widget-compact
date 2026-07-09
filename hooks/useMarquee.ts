"use client";

import { RefObject, useEffect, useState } from "react";

export function useMarquee(
  containerRef: RefObject<HTMLElement | null>,
  textRef: RefObject<HTMLElement | null>,
  text: string
): number {
  const [distance, setDistance] = useState(0);

  useEffect(() => {
    const container = containerRef.current;
    const textEl = textRef.current;
    if (!container || !textEl) {
      setDistance(0);
      return;
    }
    const overflow = textEl.scrollWidth - container.clientWidth;
    setDistance(overflow > 1 ? overflow : 0);
  }, [containerRef, textRef, text]);

  return distance;
}
