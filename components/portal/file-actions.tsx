"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

/** Secure download (short-lived signed link) and, for the owner, delete. */
export function FileActions({ fileId, canDelete = true }: { fileId: string; canDelete?: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function download() {
    setError(null);
    const res = await fetch(`/api/dashboard/uploads/${fileId}`);
    const data = await res.json().catch(() => null);
    if (!res.ok || !data?.url) return setError(data?.error || "Could not open the file");
    window.open(data.url, "_blank", "noopener");
  }

  async function remove() {
    if (
      !confirm(
        "Delete this file from your business library?\n\nInquew uses it to make future work more accurate. Once deleted, it can't be recovered."
      )
    )
      return;
    setBusy(true);
    setError(null);
    const res = await fetch(`/api/dashboard/uploads/${fileId}`, { method: "DELETE" });
    const data = await res.json().catch(() => null);
    setBusy(false);
    if (!res.ok) return setError(data?.error || "Could not delete the file");
    router.refresh();
  }

  return (
    <span className="inline-flex flex-wrap items-center gap-3 whitespace-nowrap">
      <button type="button" onClick={download} className="min-h-[36px] font-semibold text-green underline">
        Download
      </button>
      {canDelete && (
        <button type="button" onClick={remove} disabled={busy} className="min-h-[36px] font-semibold text-[#9B2C2C] disabled:opacity-60">
          {busy ? "Deleting…" : "Delete"}
        </button>
      )}
      {error && <span className="text-[12.5px] text-[#9B2C2C]">{error}</span>}
    </span>
  );
}
