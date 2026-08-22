"use client";

import { useCallback } from "react";
import { usePathname } from "next/navigation";

const ANON_KEY = "inquew.anon.v1";

function getAnonId(): string {
  try {
    let id = window.localStorage.getItem(ANON_KEY);
    if (!id) {
      id = crypto.randomUUID();
      window.localStorage.setItem(ANON_KEY, id);
    }
    return id;
  } catch {
    return "anon-unknown";
  }
}

export function useTrackEvent() {
  const pathname = usePathname();

  return useCallback(
    (type: string, metadata?: Record<string, unknown>) => {
      const payload = { type, path: pathname, anonId: getAnonId(), metadata };
      try {
        navigator.sendBeacon?.("/api/events", new Blob([JSON.stringify(payload)], { type: "application/json" })) ||
          fetch("/api/events", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
            keepalive: true
          });
      } catch {
        // Engagement tracking is best-effort; never let it break the UI.
      }
    },
    [pathname]
  );
}
