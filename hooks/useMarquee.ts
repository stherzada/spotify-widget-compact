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

    function measure() {
      if (!container || !textEl) return;
      const overflow = textEl.scrollWidth - container.clientWidth;
      setDistance(overflow > 1 ? overflow : 0);
    }

    measure();
    document.fonts?.ready.then(measure);

    const resizeObserver = new ResizeObserver(measure);
    resizeObserver.observe(container);

    return () => resizeObserver.disconnect();
  }, [containerRef, textRef, text]);

  return distance;
}
