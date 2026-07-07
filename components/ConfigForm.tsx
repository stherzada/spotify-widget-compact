"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import styles from "@/app/page.module.css";

const SID_STORAGE_KEY = "spotify_widget_sid";
const PREFS_STORAGE_KEY = "spotify_widget_prefs";

interface Prefs {
  twitchChannel: string;
  visibilityDurationSeconds: number;
  hideAlbumArt: boolean;
  glassEffect: boolean;
}

const DEFAULT_PREFS: Prefs = {
  twitchChannel: "",
  visibilityDurationSeconds: 0,
  hideAlbumArt: false,
  glassEffect: false,
};

const ERROR_MESSAGES: Record<string, string> = {
  access_denied: "You cancelled the Spotify authorization.",
  invalid_state: "That authorization link expired or was already used. Please try again.",
  token_exchange_failed: "Spotify rejected that authorization. Please try again.",
  session_store_failed: "Couldn't save your session right now. Please try again shortly.",
};

function buildWidgetUrl(origin: string, sid: string, prefs: Prefs): string {
  const url = new URL("/widget", origin);
  url.searchParams.set("sid", sid);
  if (prefs.twitchChannel.trim()) {
    url.searchParams.set("twitch", prefs.twitchChannel.trim());
  }
  if (prefs.visibilityDurationSeconds > 0) {
    url.searchParams.set("duration", String(prefs.visibilityDurationSeconds));
  }
  if (prefs.hideAlbumArt) {
    url.searchParams.set("hideAlbumArt", "1");
  }
  if (prefs.glassEffect) {
    url.searchParams.set("glassEffect", "1");
  }
  return url.toString();
}

export default function ConfigForm() {
  const searchParams = useSearchParams();
  const [sid, setSid] = useState<string | null>(null);
  const [prefs, setPrefs] = useState<Prefs>(DEFAULT_PREFS);
  const [copied, setCopied] = useState(false);
  // Lazy-initialized so it's already correct by the component's first client
  // render — no separate effect/re-render needed just to read it.
  const [origin] = useState(() => (typeof window !== "undefined" ? window.location.origin : ""));

  // Guards the persistence effect below until the load effect has had a
  // chance to run — otherwise it would fire once with the DEFAULT_PREFS from
  // the very first render and clobber whatever was already saved.
  const [hydrated, setHydrated] = useState(false);

  // On mount: pick up ?sid= from the OAuth redirect (and persist it so the
  // user can tweak prefs later without reauthorizing), otherwise fall back
  // to whatever was saved before. Reading localStorage/the URL is exactly
  // the kind of browser-only synchronization an effect is for, so the
  // several setState calls below are intentional.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    const sidFromUrl = searchParams.get("sid");
    if (sidFromUrl) {
      localStorage.setItem(SID_STORAGE_KEY, sidFromUrl);
      setSid(sidFromUrl);
      // Drop `sid` from the visible URL/history now that it's persisted.
      window.history.replaceState({}, "", window.location.pathname);
    } else {
      setSid(localStorage.getItem(SID_STORAGE_KEY));
    }

    const storedPrefs = localStorage.getItem(PREFS_STORAGE_KEY);
    if (storedPrefs) {
      try {
        setPrefs({ ...DEFAULT_PREFS, ...JSON.parse(storedPrefs) });
      } catch {
        // Ignore malformed local storage content.
      }
    }

    setHydrated(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  useEffect(() => {
    if (hydrated) {
      localStorage.setItem(PREFS_STORAGE_KEY, JSON.stringify(prefs));
    }
  }, [prefs, hydrated]);

  const errorCode = searchParams.get("error");
  const widgetUrl = useMemo(
    () => (sid && origin ? buildWidgetUrl(origin, sid, prefs) : ""),
    [sid, origin, prefs]
  );

  function handleCopy() {
    navigator.clipboard.writeText(widgetUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  }

  function handleUseDifferentAccount() {
    localStorage.removeItem(SID_STORAGE_KEY);
    setSid(null);
  }

  return (
    <div className={styles.card}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/logo.webp" alt="Spotify Widget Compact" className={styles.logo} />

      {errorCode && (
        <div className={styles.errorBanner}>
          {ERROR_MESSAGES[errorCode] ?? "Something went wrong while connecting to Spotify."}
        </div>
      )}

      {!sid ? (
        <div className={styles.stack}>
          <p>
            Connect your Spotify account to generate a Browser Source URL for OBS.
          </p>
          <a className={styles.button} href="/api/auth/login">
            Connect with Spotify
          </a>
        </div>
      ) : (
        <>
          <p className={styles.successHeading}>Connected to Spotify</p>

          <label className={styles.field}>
            <span className={styles.fieldLabel}>Twitch Channel (Optional)</span>
            <input
              className={styles.input}
              type="text"
              placeholder="e.g. stherzada"
              value={prefs.twitchChannel}
              onChange={(e) => setPrefs((p) => ({ ...p, twitchChannel: e.target.value }))}
            />
            <span className={styles.hint}>Lets viewers reveal the widget with a `!music` chat command.</span>
          </label>

          <label className={styles.field}>
            <span className={styles.fieldLabel}>Hide Widget After (Seconds)</span>
            <input
              className={styles.input}
              type="number"
              min={0}
              placeholder="0 = Always Visible"
              value={prefs.visibilityDurationSeconds}
              onChange={(e) =>
                setPrefs((p) => ({
                  ...p,
                  visibilityDurationSeconds: Math.max(0, Number(e.target.value) || 0),
                }))
              }
            />
          </label>

          <label className={styles.checkboxField}>
            <input
              type="checkbox"
              checked={prefs.hideAlbumArt}
              onChange={(e) => setPrefs((p) => ({ ...p, hideAlbumArt: e.target.checked }))}
            />
            Hide Album Art
          </label>

          <label className={styles.checkboxField}>
            <input
              type="checkbox"
              checked={prefs.glassEffect}
              onChange={(e) => setPrefs((p) => ({ ...p, glassEffect: e.target.checked }))}
            />
            Glass Effect
          </label>

          <div className={styles.divider} />

          <p className={styles.fieldLabel}>Your OBS Browser Source URL:</p>
          <div className={styles.urlBox}>{widgetUrl}</div>
          <button
            className={`${styles.copyButton} ${copied ? styles.copied : ""}`}
            onClick={handleCopy}
          >
            {copied ? "Copied to clipboard" : "Click to copy URL"}
          </button>

          <div className={styles.linkRow}>
            <button className={styles.linkButton} onClick={handleUseDifferentAccount}>
              Use a different Spotify account
            </button>
          </div>
        </>
      )}

      <div className={styles.linkRow}>
        <a
          href="https://nuttylmao.notion.site/Spotify-Widget-Compact-Edition-1ac19969b23780ae8c63c4472db0ee6b"
          target="_blank"
          rel="noreferrer"
        >
          Instructions
        </a>
      </div>
    </div>
  );
}
