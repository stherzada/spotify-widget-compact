"use client";

import { RefObject, useEffect } from "react";

/**
 * OBS Browser Sources come in all sorts of pixel dimensions. This scales the
 * widget (uniformly, from its natural ~400px-wide layout) to fit whatever
 * width the source canvas ends up being, so it never gets clipped.
 */
export function useAutoScale(ref: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Measured once: the layout's natural width plus a little breathing room.
    const naturalWidth = el.clientWidth + 100;

    function applyScale() {
      if (!el) return;
      const scale = window.innerWidth / naturalWidth;
      el.style.transform = `translate(-50%, 50%) scale(${scale})`;
    }

    applyScale();
    window.addEventListener("resize", applyScale);
    return () => window.removeEventListener("resize", applyScale);
  }, [ref]);
}
