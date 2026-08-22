"use client";

import { useState } from "react";

export function DownloadButton({ fileId }: { fileId: string }) {
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);

  async function download() {
    setStatus("loading");
    setMessage(null);
    try {
      const res = await fetch(`/api/dashboard/files/${fileId}/download`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || data.error || "Could not download file");
      window.open(data.url, "_blank", "noopener,noreferrer");
      setStatus("idle");
    } catch (err) {
      setStatus("error");
      setMessage(err instanceof Error ? err.message : "Something went wrong");
    }
  }

  return (
    <div>
      <button
        onClick={download}
        disabled={status === "loading"}
        className="w-full rounded-[10px] bg-cyan py-[11px] text-[14px] font-semibold text-cyan-ink hover:bg-cyan-hover disabled:opacity-60"
      >
        {status === "loading" ? "Preparing…" : "Download"}
      </button>
      {message && <p className="mt-2 text-[12px] text-red-700">{message}</p>}
    </div>
  );
}
