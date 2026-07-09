/** Formats a duration in seconds as `m:ss`, e.g. 125 -> "2:05". */
export function formatTime(totalSeconds: number): string {
  const safeSeconds = Number.isFinite(totalSeconds) ? Math.max(0, totalSeconds) : 0;
  const minutes = Math.floor(safeSeconds / 60);
  const seconds = Math.trunc(safeSeconds - minutes * 60);

  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

const HEX_COLOR_RE = /^#[0-9a-fA-F]{6}$/;

/**
 * Validates a `#rrggbb` color (what an `<input type="color">` produces).
 * Anything else — missing, malformed, or an attempt to inject arbitrary CSS —
 * falls back to `fallback` rather than being passed through to a CSS custom
 * property.
 */
export function sanitizeHexColor(value: string | null | undefined, fallback: string): string {
  if (!value) return fallback;
  const normalized = value.startsWith("#") ? value : `#${value}`;
  return HEX_COLOR_RE.test(normalized) ? normalized : fallback;
}
