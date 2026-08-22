"use client";

import { useEffect, useState } from "react";
import type { PublicDeliverable } from "@/lib/types";

let cache: PublicDeliverable[] | null = null;
let inflight: Promise<PublicDeliverable[]> | null = null;

async function fetchCatalog(): Promise<PublicDeliverable[]> {
  if (cache) return cache;
  if (!inflight) {
    inflight = fetch("/api/catalog")
      .then((r) => r.json())
      .then((data: PublicDeliverable[]) => {
        cache = data;
        return data;
      });
  }
  return inflight;
}

export function useCatalog() {
  const [items, setItems] = useState<PublicDeliverable[] | null>(cache);

  useEffect(() => {
    let active = true;
    if (!cache) {
      fetchCatalog().then((data) => {
        if (active) setItems(data);
      });
    }
    return () => {
      active = false;
    };
  }, []);

  const byId = new Map((items ?? []).map((i) => [i.id, i]));
  return { items: items ?? [], byId, loading: items === null };
}
