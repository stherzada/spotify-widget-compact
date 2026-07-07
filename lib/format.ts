/** Formats a duration in seconds as `m:ss`, e.g. 125 -> "2:05". */
export function formatTime(totalSeconds: number): string {
  const safeSeconds = Number.isFinite(totalSeconds) ? Math.max(0, totalSeconds) : 0;
  const minutes = Math.floor(safeSeconds / 60);
  const seconds = Math.trunc(safeSeconds - minutes * 60);

  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}
