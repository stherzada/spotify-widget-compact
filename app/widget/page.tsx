import Link from "next/link";
import NowPlaying from "@/components/NowPlaying";
import { sanitizeHexColor, sanitizeWidgetPosition } from "@/lib/format";

interface WidgetPageProps {
  searchParams: Promise<{
    sid?: string;
    twitch?: string;
    duration?: string;
    hideAlbumArt?: string;
    glassEffect?: string;
    accent?: string;
    text?: string;
    position?: string;
  }>;
}

export default async function WidgetPage({ searchParams }: WidgetPageProps) {
  const params = await searchParams;
  const sid = params.sid ?? "";

  if (!sid) {
    return (
      <p style={{ padding: 20, fontFamily: "sans-serif" }}>
        Missing <code>sid</code>. Generate a widget URL from the{" "}
        <Link href="/">config page</Link> first.
      </p>
    );
  }

  return (
    <NowPlaying
      sid={sid}
      twitchChannel={params.twitch ?? ""}
      visibilityDurationSeconds={Number(params.duration) > 0 ? Number(params.duration) : 0}
      hideAlbumArt={params.hideAlbumArt === "1" || params.hideAlbumArt === "true"}
      glassEffect={params.glassEffect === "1" || params.glassEffect === "true"}
      accentColor={sanitizeHexColor(params.accent, "#ffffff")}
      textColor={sanitizeHexColor(params.text, "#ffffff")}
      position={sanitizeWidgetPosition(params.position)}
    />
  );
}
