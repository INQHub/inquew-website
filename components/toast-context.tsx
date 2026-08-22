"use client";

import { createContext, useCallback, useContext, useRef, useState } from "react";
import Link from "next/link";

type ToastState = { message: string; href?: string; linkLabel?: string } | null;

const ToastContext = createContext<((message: string, opts?: { href?: string; linkLabel?: string }) => void) | null>(
  null
);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toast, setToast] = useState<ToastState>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>();

  const flash = useCallback((message: string, opts?: { href?: string; linkLabel?: string }) => {
    clearTimeout(timer.current);
    setToast({ message, href: opts?.href, linkLabel: opts?.linkLabel });
    timer.current = setTimeout(() => setToast(null), 3200);
  }, []);

  return (
    <ToastContext.Provider value={flash}>
      {children}
      {toast && (
        <div className="fixed bottom-[26px] left-1/2 z-[70] flex -translate-x-1/2 items-center gap-4 rounded-2xl bg-forest px-[22px] py-[14px] text-[14.5px] text-[#F3F5E8] shadow-[0_12px_34px_rgba(26,33,6,.3)]">
          <span>{toast.message}</span>
          {toast.href && (
            <Link href={toast.href} className="text-[14px] font-semibold text-cyan hover:text-cyan">
              {toast.linkLabel ?? "View"}
            </Link>
          )}
        </div>
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
