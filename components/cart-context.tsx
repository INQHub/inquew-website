"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

export type CartLine = {
  deliverableId: string;
  video: boolean;
  zoom: boolean;
};

export type DeliveryMethod = "DASHBOARD" | "EMAIL";

type CartContextValue = {
  lines: CartLine[];
  add: (deliverableId: string, opts?: { video?: boolean; zoom?: boolean }) => boolean;
  remove: (deliverableId: string) => void;
  toggleAddon: (deliverableId: string, addon: "video" | "zoom") => void;
  clear: () => void;
  has: (deliverableId: string) => boolean;
  deliveryMethod: DeliveryMethod;
  setDeliveryMethod: (m: DeliveryMethod) => void;
};

const CartContext = createContext<CartContextValue | null>(null);
const STORAGE_KEY = "inquew.cart.v1";

type StoredState = { lines: CartLine[]; deliveryMethod: DeliveryMethod };

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>("DASHBOARD");
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed: StoredState = JSON.parse(raw);
        if (Array.isArray(parsed.lines)) setLines(parsed.lines);
        if (parsed.deliveryMethod) setDeliveryMethod(parsed.deliveryMethod);
      }
    } catch {
      /* ignore corrupt local storage */
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      const state: StoredState = { lines, deliveryMethod };
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* storage unavailable (private mode, quota) — cart just won't persist */
    }
  }, [lines, deliveryMethod, hydrated]);

  const value = useMemo<CartContextValue>(
    () => ({
      lines,
      has: (id) => lines.some((l) => l.deliverableId === id),
      add: (deliverableId, opts) => {
        let added = true;
        setLines((prev) => {
          if (prev.some((l) => l.deliverableId === deliverableId)) {
            added = false;
            return prev;
          }
          return [...prev, { deliverableId, video: !!opts?.video, zoom: !!opts?.zoom }];
        });
        return added;
      },
      remove: (deliverableId) => setLines((prev) => prev.filter((l) => l.deliverableId !== deliverableId)),
      toggleAddon: (deliverableId, addon) =>
        setLines((prev) => prev.map((l) => (l.deliverableId === deliverableId ? { ...l, [addon]: !l[addon] } : l))),
      clear: () => setLines([]),
      deliveryMethod,
      setDeliveryMethod
    }),
    [lines, deliveryMethod]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
