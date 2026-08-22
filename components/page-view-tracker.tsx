"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useTrackEvent } from "@/components/use-track-event";

export function PageViewTracker() {
  const pathname = usePathname();
  const track = useTrackEvent();

  useEffect(() => {
    track("page_view");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  return null;
}
