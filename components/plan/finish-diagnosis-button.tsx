"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { QuotaPrompt } from "@/components/plan/quota-prompt";
import type { PlanUsage } from "@/lib/plans";

/** Finishes a saved intake that was stopped at the plan limit. */
export function FinishDiagnosisButton({ intakeId }: { intakeId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [usage, setUsage] = useState<PlanUsage | null>(null);

  async function finish() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/intake/${intakeId}/diagnostic`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "finalize" })
      });
      const data = await res.json().catch(() => null);
      if (res.status === 402 && data?.usage) return setUsage(data.usage);
      if (!res.ok) throw new Error(data?.error || "Could not finish your diagnosis");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not finish your diagnosis");
    } finally {
      setBusy(false);
    }
  }

  if (usage) return <QuotaPrompt usage={usage} />;

  return (
    <div className="grid justify-items-start gap-3">
      <button
        onClick={finish}
        disabled={busy}
        className="inline-flex min-h-[44px] items-center justify-center rounded-full bg-green px-7 py-[14px] text-[16px] font-semibold text-white hover:bg-forest disabled:cursor-not-allowed disabled:bg-[#D5DBD7] disabled:text-muted"
      >
        {busy ? "Writing your diagnosis…" : "Finish my diagnosis"}
      </button>
      {error && (
        <p role="alert" className="text-[14.5px] font-semibold text-[#9B2C2C]">
          {error}
        </p>
      )}
    </div>
  );
}
