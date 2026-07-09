"use client";

import { useEffect } from "react";
import type { Client as TmiClientInstance } from "tmi.js";

export function useTwitchCommand(channel: string, onCommand: () => void) {
  useEffect(() => {
    if (!channel) return;

    let cancelled = false;
    let client: TmiClientInstance | null = null;

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
