"use client";

import { useCallback, useRef, type CSSProperties } from "react";
import { useNowPlaying } from "@/hooks/useNowPlaying";
import { useTwitchCommand } from "@/hooks/useTwitchCommand";
import { useCrossfade, useDelayedValue } from "@/hooks/useCrossfade";
import { useAutoScale } from "@/hooks/useAutoScale";
import { useTrackProgress } from "@/hooks/useTrackProgress";
import { useMarquee } from "@/hooks/useMarquee";
import { formatTime } from "@/lib/format";
import type { WidgetPosition } from "@/lib/types";
import styles from "@/app/widget/widget.module.css";

const PLACEHOLDER_ALBUM_ART = "/placeholder-album-art.png";
const BACKGROUND_LAYER_DELAY_MS = 1000;

export interface NowPlayingProps {
  sid: string;
  twitchChannel: string;
  visibilityDurationSeconds: number;
  hideAlbumArt: boolean;
  glassEffect: boolean;
  accentColor?: string;
  textColor?: string;
  position?: WidgetPosition;
}

export default function NowPlaying({
  sid,
  twitchChannel,
  visibilityDurationSeconds,
  hideAlbumArt,
  glassEffect,
  accentColor = "#ffffff",
  textColor = "#ffffff",
  position = "center",
}: NowPlayingProps) {
  const { nowPlaying, visible, reveal } = useNowPlaying(sid, visibilityDurationSeconds);
  const onTwitchCommand = useCallback(() => reveal(), [reveal]);
  useTwitchCommand(twitchChannel, onTwitchCommand);

  const containerRef = useRef<HTMLDivElement>(null);
  useAutoScale(containerRef, position);

  const albumArt = nowPlaying?.albumArt ?? PLACEHOLDER_ALBUM_ART;
  const { displayValue: albumArtSrc, fading: albumArtFading } = useCrossfade(albumArt);
  const backgroundBack = useDelayedValue(albumArt, BACKGROUND_LAYER_DELAY_MS);

  const { displayValue: songName, fading: songFading } = useCrossfade(nowPlaying?.name ?? "");
  const { displayValue: artist, fading: artistFading } = useCrossfade(nowPlaying?.artist ?? "");

  const songLabelRef = useRef<HTMLDivElement>(null);
  const songTextRef = useRef<HTMLSpanElement>(null);
  const songMarqueeDistance = useMarquee(songLabelRef, songTextRef, songName);

  const artistLabelRef = useRef<HTMLDivElement>(null);
  const artistTextRef = useRef<HTMLSpanElement>(null);
  const artistMarqueeDistance = useMarquee(artistLabelRef, artistTextRef, artist);

  const durationMs = nowPlaying?.durationMs ?? 0;
  const progressMs = useTrackProgress(nowPlaying);
  const progressPercent = durationMs > 0 ? (progressMs / durationMs) * 100 : 0;
  const progressTime = formatTime(progressMs / 1000);
  const timeRemaining = formatTime((durationMs - progressMs) / 1000);

  const containerClassName = [
    styles.container,
    visible && styles.containerVisible,
    glassEffect && styles.glassEffect,
  ]
    .filter(Boolean)
    .join(" ");

  const rootStyle = {
    "--accent-color": accentColor,
    "--text-color": textColor,
  } as CSSProperties;

  return (
    <div className={styles.root} style={rootStyle}>
      <div ref={containerRef} className={containerClassName} data-position={position}>
        {!hideAlbumArt && (
          <div className={styles.albumArtBox}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={albumArtSrc}
              alt=""
              className={`${styles.albumArt} ${albumArtFading ? styles.albumArtFading : ""}`}
            />
          </div>
        )}

        <div className={styles.songInfoBox}>
          <div className={styles.songInfo}>
            <div className={styles.songDetails}>
              <div
                ref={songLabelRef}
                className={`${styles.songLabel} ${songFading ? styles.textFading : ""} ${
                  songMarqueeDistance ? styles.marqueeActive : ""
                }`}
              >
                <span
                  ref={songTextRef}
                  className={songMarqueeDistance ? styles.marqueeText : undefined}
                  style={
                    songMarqueeDistance
                      ? ({ "--marquee-distance": `${songMarqueeDistance}px` } as CSSProperties)
                      : undefined
                  }
                >
                  {songName}
                </span>
              </div>
              <div
                ref={artistLabelRef}
                className={`${styles.artistLabel} ${artistFading ? styles.textFading : ""} ${
                  artistMarqueeDistance ? styles.marqueeActive : ""
                }`}
              >
                <span
                  ref={artistTextRef}
                  className={artistMarqueeDistance ? styles.marqueeText : undefined}
                  style={
                    artistMarqueeDistance
                      ? ({ "--marquee-distance": `${artistMarqueeDistance}px` } as CSSProperties)
                      : undefined
                  }
                >
                  {artist}
                </span>
              </div>
              <div className={styles.times}>
                <div className={styles.progressTime}>{progressTime}</div>
                <div className={styles.progressBg}>
                  <div className={styles.progressBar} style={{ width: `${progressPercent}%` }} />
                </div>
                <div className={styles.timeRemaining}>-{timeRemaining}</div>
              </div>
            </div>
          </div>

          <div className={styles.backgroundArt}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={albumArtSrc}
              alt=""
              className={`${styles.backgroundImage} ${
                albumArtFading ? styles.backgroundImageFading : ""
              }`}
            />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={backgroundBack} alt="" className={styles.backgroundImageBack} />
          </div>
        </div>
      </div>
    </div>
  );
}
