"use client";

import { useCallback, useRef } from "react";
import { useNowPlaying } from "@/hooks/useNowPlaying";
import { useTwitchCommand } from "@/hooks/useTwitchCommand";
import { useCrossfade, useDelayedValue } from "@/hooks/useCrossfade";
import { useAutoScale } from "@/hooks/useAutoScale";
import { formatTime } from "@/lib/format";
import styles from "@/app/widget/widget.module.css";

const PLACEHOLDER_ALBUM_ART = "/placeholder-album-art.png";
const BACKGROUND_LAYER_DELAY_MS = 1000;

export interface NowPlayingProps {
  sid: string;
  twitchChannel: string;
  visibilityDurationSeconds: number;
  hideAlbumArt: boolean;
  glassEffect: boolean;
}

export default function NowPlaying({
  sid,
  twitchChannel,
  visibilityDurationSeconds,
  hideAlbumArt,
  glassEffect,
}: NowPlayingProps) {
  const { nowPlaying, visible, reveal } = useNowPlaying(sid, visibilityDurationSeconds);
  const onTwitchCommand = useCallback(() => reveal(), [reveal]);
  useTwitchCommand(twitchChannel, onTwitchCommand);

  const containerRef = useRef<HTMLDivElement>(null);
  useAutoScale(containerRef);

  const albumArt = nowPlaying?.albumArt ?? PLACEHOLDER_ALBUM_ART;
  const { displayValue: albumArtSrc, fading: albumArtFading } = useCrossfade(albumArt);
  const backgroundBack = useDelayedValue(albumArt, BACKGROUND_LAYER_DELAY_MS);

  const { displayValue: songName, fading: songFading } = useCrossfade(nowPlaying?.name ?? "");
  const { displayValue: artist, fading: artistFading } = useCrossfade(nowPlaying?.artist ?? "");

  const durationMs = nowPlaying?.durationMs ?? 0;
  const progressMs = nowPlaying?.progressMs ?? 0;
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

  return (
    <div className={styles.root}>
      <div ref={containerRef} className={containerClassName}>
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
              <div className={`${styles.songLabel} ${songFading ? styles.textFading : ""}`}>
                {songName}
              </div>
              <div className={`${styles.artistLabel} ${artistFading ? styles.textFading : ""}`}>
                {artist}
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
