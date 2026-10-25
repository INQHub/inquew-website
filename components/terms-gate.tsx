"use client";

import { useEffect, useRef, useState } from "react";
import { TERMS_PARAGRAPHS, TERMS_TITLE, TERMS_VERSION } from "@/lib/terms";
import { formatCents } from "@/lib/money";

type Line = { title: string; amountCents: number };

/**
 * Shown before every purchase. The accept button stays disabled until the client ticks
 * the box, and the parent only calls the checkout API from onAccept, so an order can't
 * be created without an acceptance (the API rejects it too).
 */
export function TermsGate({
  open,
  lines,
  totalCents,
  busy,
  onCancel,
  onAccept
}: {
  open: boolean;
  lines: Line[];
  totalCents: number;
  busy: boolean;
  onCancel: () => void;
  onAccept: (version: string) => void;
}) {
  const [agreed, setAgreed] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    setAgreed(false);
    dialogRef.current?.focus();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !busy) onCancel();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, busy, onCancel]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-start justify-center overflow-y-auto bg-[rgba(20,32,24,.55)] px-5 py-10">
      <div
        ref={dialogRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby="terms-title"
        className="w-full max-w-[640px] overflow-hidden rounded-3xl bg-white shadow-[0_30px_70px_rgba(20,64,26,.35)] outline-none"
      >
        <div className="flex items-center gap-4 bg-forest px-7 py-6 text-white">
          <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-full bg-white">
            <img src="/assets/mascots/pen.png" alt="" className="h-10 w-auto" />
          </div>
          <div>
            <h2 id="terms-title" className="text-[22px] font-bold text-white">
              {TERMS_TITLE}
            </h2>
            <p className="text-[14px] text-[#DCE8E0]">Please read and accept before payment · Version {TERMS_VERSION}</p>
          </div>
        </div>

        <div className="grid gap-[6px] px-7 pt-5 text-[15px]">
          {lines.map((l, i) => (
            <div key={i} className="flex justify-between gap-3">
              <span>{l.title}</span>
              <span className="font-semibold">{formatCents(l.amountCents)}</span>
            </div>
          ))}
          <div className="mt-1 flex justify-between border-t border-line pt-2 text-[16px] font-bold text-forest">
            <span>Total</span>
            <span>{formatCents(totalCents)}</span>
          </div>
        </div>

        <div
          tabIndex={0}
          aria-label="Terms text"
          className="mx-7 mt-5 grid max-h-[300px] gap-3 overflow-y-auto rounded-2xl border border-line bg-sand p-5 text-[15px] text-[#36423B]"
        >
          {TERMS_PARAGRAPHS.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>

        <div className="grid gap-[18px] px-7 pb-7 pt-5">
          <label htmlFor="accept-terms" className="flex min-h-[44px] cursor-pointer items-start gap-3">
            <input
              id="accept-terms"
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="mt-[2px] h-[22px] w-[22px] flex-shrink-0 accent-green"
            />
            <span className="font-semibold">I have read and accept the Inquew Deliverable Terms.</span>
          </label>
          <div className="flex flex-wrap justify-end gap-3">
            <button
              type="button"
              onClick={onCancel}
              disabled={busy}
              className="rounded-full border border-line3 px-[22px] py-[13px] font-semibold text-forest disabled:opacity-60"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={!agreed || busy}
              onClick={() => onAccept(TERMS_VERSION)}
              className="rounded-full bg-green px-6 py-[13px] font-semibold text-white disabled:cursor-not-allowed disabled:bg-[#D5DBD7] disabled:text-muted"
            >
              {busy ? "Preparing…" : "Accept and continue to payment"}
            </button>
          </div>
          <p className="text-[13px] text-faint">
            Your acceptance is recorded with the date, time and terms version, and shown with your order.
          </p>
        </div>
      </div>
    </div>
  );
}
