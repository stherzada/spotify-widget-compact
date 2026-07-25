"use client";

import { useRef, type CSSProperties } from "react";
import { useMarquee } from "@/hooks/useMarquee";
import widgetStyles from "@/app/widget/widget.module.css";
import previewStyles from "./WidgetPreview.module.css";

const PLACEHOLDER_ALBUM_ART = "/placeholder-album-art.png";

const SAMPLE_TRACK = {
  name: "A Very Long Song Title That Overflows The Widget Layout",
  artist: "Artist One, Artist Two, Artist Three & Artist Four",
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
  const songLabelRef = useRef<HTMLDivElement>(null);
  const songTextRef = useRef<HTMLSpanElement>(null);
  const songMarqueeDistance = useMarquee(songLabelRef, songTextRef, SAMPLE_TRACK.name);

  const artistLabelRef = useRef<HTMLDivElement>(null);
  const artistTextRef = useRef<HTMLSpanElement>(null);
  const artistMarqueeDistance = useMarquee(artistLabelRef, artistTextRef, SAMPLE_TRACK.artist);

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
                  <div
                    ref={songLabelRef}
                    className={`${widgetStyles.songLabel} ${songMarqueeDistance ? widgetStyles.marqueeActive : ""
                      }`}
                  >
                    <span
                      ref={songTextRef}
                      className={`${widgetStyles.marqueeMeasure} ${songMarqueeDistance ? widgetStyles.marqueeText : ""}`}
                      style={
                        songMarqueeDistance
                          ? ({ "--marquee-distance": `${songMarqueeDistance}px` } as CSSProperties)
                          : undefined
                      }
                    >
                      {SAMPLE_TRACK.name}
                    </span>
                  </div>
                  <div
                    ref={artistLabelRef}
                    className={`${widgetStyles.artistLabel} ${artistMarqueeDistance ? widgetStyles.marqueeActive : ""
                      }`}
                  >
                    <span
                      ref={artistTextRef}
                      className={`${widgetStyles.marqueeMeasure} ${artistMarqueeDistance ? widgetStyles.marqueeText : ""}`}
                      style={
                        artistMarqueeDistance
                          ? ({ "--marquee-distance": `${artistMarqueeDistance}px` } as CSSProperties)
                          : undefined
                      }
                    >
                      {SAMPLE_TRACK.artist}
                    </span>
                  </div>
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
