"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function RegenerateStatementsButton({ intakeId }: { intakeId: string }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function regenerate() {
    setLoading(true);
    await fetch(`/api/intake/${intakeId}/statements`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "regenerate" })
    });
    setLoading(false);
    router.refresh();
  }

  return (
    <button onClick={regenerate} disabled={loading} className="rounded-[10px] border border-line3 px-4 py-2 text-[13.5px] font-semibold disabled:opacity-60">
      {loading ? "Generating…" : "Generate a new statement set"}
    </button>
  );
}
