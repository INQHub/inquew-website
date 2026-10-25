"use client";

import { useState } from "react";
import { EXTRA_DIAGNOSTIC_CENTS, MAX_EXTRA_PER_PURCHASE } from "@/lib/plans";
import { formatCents } from "@/lib/money";

const btnPrimary =
  "inline-flex min-h-[44px] items-center justify-center rounded-full bg-green px-6 py-3 text-[15px] font-semibold text-white hover:bg-forest disabled:cursor-not-allowed disabled:bg-[#D5DBD7] disabled:text-muted";
const btnSecondary =
  "inline-flex min-h-[44px] items-center justify-center rounded-full border border-line3 bg-white px-6 py-3 text-[15px] font-semibold text-forest hover:border-green disabled:opacity-60";

/** POSTs to a billing route and follows the Stripe URL it returns. */
function useStripeRedirect() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function go(path: string, body: object = {}) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.url) throw new Error(data?.error || "Something went wrong. Please try again.");
      window.location.href = data.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
      setBusy(false);
    }
  }
  return { busy, error, go };
}

function ErrorLine({ error }: { error: string | null }) {
  return error ? (
    <p role="alert" className="text-[14px] font-semibold text-[#9B2C2C]">
      {error}
    </p>
  ) : null;
}

export function ChoosePlanButton({ plan, label, primary = true, disabled = false }: { plan: "PRO" | "PREMIUM"; label: string; primary?: boolean; disabled?: boolean }) {
  const { busy, error, go } = useStripeRedirect();
  return (
    <div className="grid gap-2">
      <button onClick={() => go("/api/billing/checkout", { plan })} disabled={busy || disabled} className={primary ? btnPrimary : btnSecondary}>
        {busy ? "Opening secure checkout…" : label}
      </button>
      <ErrorLine error={error} />
    </div>
  );
}

export function ManageBillingButton({ label = "Manage billing" }: { label?: string }) {
  const { busy, error, go } = useStripeRedirect();
  return (
    <div className="grid gap-2">
      <button onClick={() => go("/api/billing/portal")} disabled={busy} className={btnSecondary}>
        {busy ? "Opening…" : label}
      </button>
      <ErrorLine error={error} />
    </div>
  );
}

export function BuyExtrasForm({ disabled = false }: { disabled?: boolean }) {
  const { busy, error, go } = useStripeRedirect();
  const [quantity, setQuantity] = useState(1);
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        void go("/api/billing/extras", { quantity });
      }}
      className="grid gap-3"
    >
      <div className="flex flex-wrap items-center gap-3">
        <label htmlFor="extra-qty" className="text-[15px] font-semibold">
          How many?
        </label>
        <select
          id="extra-qty"
          value={quantity}
          onChange={(e) => setQuantity(Number(e.target.value))}
          className="rounded-xl border border-line3 bg-white px-[14px] py-[10px] text-[15px]"
        >
          {Array.from({ length: MAX_EXTRA_PER_PURCHASE }, (_, i) => i + 1).map((n) => (
            <option key={n} value={n}>
              {n} · {formatCents(n * EXTRA_DIAGNOSTIC_CENTS)}
            </option>
          ))}
        </select>
        <button type="submit" disabled={busy || disabled} className={btnPrimary}>
          {busy ? "Opening secure checkout…" : `Buy for ${formatCents(quantity * EXTRA_DIAGNOSTIC_CENTS)}`}
        </button>
      </div>
      <ErrorLine error={error} />
    </form>
  );
}
