"use client";

import type { CSSProperties } from "react";
import widgetStyles from "@/app/widget/widget.module.css";
import previewStyles from "./WidgetPreview.module.css";
import type { WidgetPosition } from "@/lib/types";

const PLACEHOLDER_ALBUM_ART = "/placeholder-album-art.png";

const SAMPLE_TRACK = {
  name: "Example Song Title",
  artist: "Example Artist",
  progressTime: "1:23",
  timeRemaining: "2:05",
  progressPercent: 40,
};

// The real widget anchors via `position: fixed` + viewport units (see
// widget.module.css's `[data-position=...]` rules and `useAutoScale`), which
// would break out of this bounded preview box. Flexbox alignment on the
// frame approximates the same anchor instead.
const POSITION_ALIGN: Record<WidgetPosition, CSSProperties> = {
  center: { alignItems: "center", justifyContent: "center" },
  top: { alignItems: "flex-start", justifyContent: "center" },
  bottom: { alignItems: "flex-end", justifyContent: "center" },
  "top-left": { alignItems: "flex-start", justifyContent: "flex-start" },
  "top-right": { alignItems: "flex-start", justifyContent: "flex-end" },
  "bottom-left": { alignItems: "flex-end", justifyContent: "flex-start" },
  "bottom-right": { alignItems: "flex-end", justifyContent: "flex-end" },
};

export interface WidgetPreviewProps {
  hideAlbumArt: boolean;
  glassEffect: boolean;
  accentColor: string;
  textColor: string;
  position: WidgetPosition;
}

/**
 * Renders a static, contained preview of the widget on the config page —
 * reuses `widget.module.css` so it always matches the real thing, but
 * without `useAutoScale`, polling, or Twitch (none of that applies to a
 * fixed sample track in a bounded box).
 */
export default function WidgetPreview({
  hideAlbumArt,
  glassEffect,
  accentColor,
  textColor,
  position,
}: WidgetPreviewProps) {
  const containerClassName = [
    widgetStyles.container,
    widgetStyles.containerVisible,
    glassEffect && widgetStyles.glassEffect,
  ]
    .filter(Boolean)
    .join(" ");

  const rootStyle = {
    "--accent-color": accentColor,
    "--text-color": textColor,
  } as CSSProperties;

  return (
    <div className={previewStyles.previewFrame}>
      <span className={previewStyles.previewLabel}>Preview</span>
      <div className={widgetStyles.root} style={rootStyle}>
        <div className={previewStyles.previewStage} style={POSITION_ALIGN[position]}>
          {/* Overrides the real widget's fixed/viewport-anchored positioning
              so it lays out normally inside the flex stage above. */}
          <div className={containerClassName} style={{ position: "static", margin: 0, opacity: 1 }}>
            {!hideAlbumArt && (
              <div className={widgetStyles.albumArtBox}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={PLACEHOLDER_ALBUM_ART} alt="" className={widgetStyles.albumArt} />
              </div>
            )}

            <div className={widgetStyles.songInfoBox}>
              <div className={widgetStyles.songInfo}>
                <div className={widgetStyles.songDetails}>
                  <div className={widgetStyles.songLabel}>{SAMPLE_TRACK.name}</div>
                  <div className={widgetStyles.artistLabel}>{SAMPLE_TRACK.artist}</div>
                  <div className={widgetStyles.times}>
                    <div className={widgetStyles.progressTime}>{SAMPLE_TRACK.progressTime}</div>
                    <div className={widgetStyles.progressBg}>
                      <div
                        className={widgetStyles.progressBar}
                        style={{ width: `${SAMPLE_TRACK.progressPercent}%` }}
                      />
                    </div>
                    <div className={widgetStyles.timeRemaining}>-{SAMPLE_TRACK.timeRemaining}</div>
                  </div>
                </div>
              </div>

              <div className={widgetStyles.backgroundArt}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={PLACEHOLDER_ALBUM_ART} alt="" className={widgetStyles.backgroundImage} />
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={PLACEHOLDER_ALBUM_ART} alt="" className={widgetStyles.backgroundImageBack} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
