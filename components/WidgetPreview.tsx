"use client";

import type { CSSProperties } from "react";
import widgetStyles from "@/app/widget/widget.module.css";
import previewStyles from "./WidgetPreview.module.css";

const PLACEHOLDER_ALBUM_ART = "/placeholder-album-art.png";

const SAMPLE_TRACK = {
  name: "Song Title",
  artist: "Artist Name",
  progressTime: "1:23",
  timeRemaining: "2:05",
  progressPercent: 40,
  lyricLine: "Never gonna give you up",
};

export interface WidgetPreviewProps {
  hideAlbumArt: boolean;
  glassEffect: boolean;
  showLyrics?: boolean;
  accentColor: string;
  textColor: string;
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
  showLyrics = false,
  accentColor,
  textColor,
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
    // `.root` has no height of its own in the real widget (everything inside
    // is `position: fixed`, so it doesn't need one there). Here it's the
    // direct child of the fixed-height preview frame, so it needs an
    // explicit height for `previewStage`'s `height: 100%` to resolve against
    // — otherwise that percentage falls back to `auto` and vertical
    // centering has no space to work with.
    height: "100%",
  } as CSSProperties;

  return (
    <div className={previewStyles.previewFrame}>
      <span className={previewStyles.previewLabel}>Preview</span>
      <div className={widgetStyles.root} style={rootStyle}>
        <div className={previewStyles.previewStage}>
          <div
            className={containerClassName}
            style={{
              position: "static",
              margin: 0,
              opacity: 1,
              // The real widget relies on `width: 100%; max-width: 400px`
              // resolving against the viewport (via `position: fixed`) to
              // size itself. As a plain flex item here, that combination is
              // ambiguous across browsers when it's the flex line's only
              // item, so pin an unambiguous width instead.
              width: "min(400px, 100%)",
            }}
          >
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
                  {showLyrics ? (
                    <div className={widgetStyles.lyricLine}>{SAMPLE_TRACK.lyricLine}</div>
                  ) : (
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
                  )}
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
