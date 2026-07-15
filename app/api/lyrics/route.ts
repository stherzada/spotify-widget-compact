import { NextRequest, NextResponse } from "next/server";
import { getSyncedLyrics } from "@/lib/lyrics";

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
    const lines = await getSyncedLyrics(
      track,
      artist,
      Number.isFinite(duration) && duration ? duration : undefined
    );
    return NextResponse.json({ lines }, { headers: CACHE_HEADERS });
  } catch (err) {
    console.error("Failed to fetch lyrics:", err);
    // Lyrics are a non-critical enhancement — fail soft so the widget falls
    // back to the normal progress bar instead of erroring out.
    return NextResponse.json({ lines: [] });
  }
}
