"use client";

import { useEffect } from "react";
import type { Client as TmiClientInstance } from "tmi.js";

/**
 * Connects (read-only, anonymous) to a Twitch channel's chat and invokes
 * `onCommand` whenever someone types `!music`. No-ops if `channel` is empty.
 */
export function useTwitchCommand(channel: string, onCommand: () => void) {
  useEffect(() => {
    if (!channel) return;

    let cancelled = false;
    let client: TmiClientInstance | null = null;

    // tmi.js pulls in a couple of Node-only deps (`ws`, `node-fetch`) that
    // it only falls back to when no native WebSocket/fetch is present, so
    // it's safe in the browser — imported lazily to keep it out of the
    // initial bundle for widgets that don't use Twitch integration.
    import("tmi.js").then(({ Client }) => {
      if (cancelled) return;

      client = new Client({ channels: [channel] });
      client.connect().catch((err) => console.error("Failed to connect to Twitch chat:", err));

      client.on("message", (_channel, _tags, message) => {
        if (message.trim().toLowerCase() === "!music") {
          onCommand();
        }
      });
    });

    return () => {
      cancelled = true;
      client?.disconnect();
    };
  }, [channel, onCommand]);
}
