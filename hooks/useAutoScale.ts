"use client";

import { RefObject, useEffect } from "react";
import type { WidgetPosition } from "@/lib/types";

// Positions anchored via `left: 50%` in CSS (see `widget.module.css`'s
// `[data-position=...]` rules) need a -50% translateX to actually center
// themselves horizontally on that point. Corner positions anchor directly to
// an edge (`left: 0` / `right: 0`) and need no horizontal translate.
const HORIZONTAL_CENTER: ReadonlySet<WidgetPosition> = new Set(["center", "top", "bottom"]);
// Only "center" anchors via `bottom: 50%` and needs the matching +50%
// translateY to center itself vertically on that point.
const VERTICAL_CENTER: ReadonlySet<WidgetPosition> = new Set(["center"]);

/**
 * OBS Browser Sources come in all sorts of pixel dimensions. This scales the
 * widget (uniformly, from its natural ~400px-wide layout) to fit whatever
 * width the source canvas ends up being, so it never gets clipped — and
 * applies the translate needed to self-center on `position`'s anchor point
 * (the CSS only sets the anchor edge/percentage, not the centering offset).
 */
export function useAutoScale(ref: RefObject<HTMLElement | null>, position: WidgetPosition) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Measured once: the layout's natural width plus a little breathing room.
    const naturalWidth = el.clientWidth + 100;
    const translateX = HORIZONTAL_CENTER.has(position) ? -50 : 0;
    const translateY = VERTICAL_CENTER.has(position) ? 50 : 0;

    function applyScale() {
      if (!el) return;
      const scale = window.innerWidth / naturalWidth;
      el.style.transform = `translate(${translateX}%, ${translateY}%) scale(${scale})`;
    }

    applyScale();
    window.addEventListener("resize", applyScale);
    return () => window.removeEventListener("resize", applyScale);
  }, [ref, position]);
}
