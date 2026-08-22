"use client";

import { useState } from "react";

export function AccountPrivacyActions() {
  const [exporting, setExporting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function downloadData() {
    setExporting(true);
    setMessage(null);
    try {
      const res = await fetch("/api/account/export");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not export data");
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "inquew-account-data.json";
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setExporting(false);
    }
  }

  async function deleteRecordings() {
    if (!confirm("Delete all intake transcripts and video references? This cannot be undone.")) return;
    setDeleting(true);
    setMessage(null);
    try {
      const res = await fetch("/api/account/delete-recordings", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not delete recordings");
      setMessage(`Cleared ${data.cleared} intake session${data.cleared === 1 ? "" : "s"}.`);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div>
      <div className="flex flex-wrap gap-3">
        <button
          onClick={downloadData}
          disabled={exporting}
          className="rounded-[11px] border border-line3 px-[18px] py-3 text-[14px] font-semibold disabled:opacity-60"
        >
          {exporting ? "Preparing…" : "Download my data"}
        </button>
        <button
          onClick={deleteRecordings}
          disabled={deleting}
          className="rounded-[11px] border border-[#E8C3C3] px-[18px] py-3 text-[14px] font-semibold text-[#A64B4B] disabled:opacity-60"
        >
          {deleting ? "Deleting…" : "Delete intake recordings"}
        </button>
      </div>
      {message && <p className="mt-3 text-[13px] text-muted">{message}</p>}
    </div>
  );
}
