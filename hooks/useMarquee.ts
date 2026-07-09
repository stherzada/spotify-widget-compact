"use client";

import { RefObject, useEffect, useState } from "react";

/**
 * Measures whether `textRef`'s natural (unwrapped) width overflows
 * `containerRef`'s visible width, and if so, returns the pixel distance the
 * text needs to travel to reveal its clipped edge — used to drive the
 * `.marqueeText` scroll animation in `widget.module.css`. Returns 0 (no
 * marquee) when the text fits.
 */
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
