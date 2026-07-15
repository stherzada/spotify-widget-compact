import { NextRequest, NextResponse } from "next/server";
import { Client } from "lrclib-api";
import type { LyricLine } from "@/lib/types";

const client = new Client();

// Lyrics for a given track are effectively immutable, so let clients/CDNs
// cache the response for a day rather than re-fetching on every track replay.
const CACHE_HEADERS = { "Cache-Control": "public, max-age=86400" };

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const track = params.get("track");
  const artist = params.get("artist");
  const durationParam = params.get("duration");

  if (!track || !artist) {
    return NextResponse.json({ error: "Missing track or artist" }, { status: 400 });
  }

  const duration = durationParam ? Number(durationParam) : undefined;

  try {
    const lines = await client.getSynced({
      track_name: track,
      artist_name: artist,
      duration: Number.isFinite(duration) && duration ? duration : undefined,
    });

    const synced: LyricLine[] = (lines ?? [])
      // `getSynced` also returns entries without a `startTime` for cases like
      // `[{ text: "[Instrumental]" }]` — those aren't timed lines, so drop them.
      .filter((line): line is { text: string; startTime: number } => typeof line.startTime === "number")
      // The library's `startTime` is in *seconds* (its docstring example is
      // misleading), so convert to ms to match the widget's `progressMs` clock.
      .map((line) => ({ text: line.text, startTimeMs: Math.round(line.startTime * 1000) }))
      .sort((a, b) => a.startTimeMs - b.startTimeMs);

    return NextResponse.json({ lines: synced }, { headers: CACHE_HEADERS });
  } catch (err) {
    console.error("Failed to fetch lyrics:", err);
    // Lyrics are a non-critical enhancement — fail soft so the widget falls
    // back to the normal progress bar instead of erroring out.
    return NextResponse.json({ lines: [] });
  }
}
