"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowser } from "@/lib/supabase-browser";

const MAX_BYTES = 25 * 1024 * 1024;

/** Upload zone for the client's business library: signed upload straight to storage. */
export function FileUploader({
  accept,
  problemSpaces
}: {
  accept: string;
  problemSpaces: { id: string; label: string }[];
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [intakeId, setIntakeId] = useState(problemSpaces[0]?.id ?? "");
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [dragging, setDragging] = useState(false);

  async function upload(files: FileList | null) {
    if (!files?.length) return;
    setError(null);
    setBusy(true);
    try {
      const supabase = getSupabaseBrowser();
      if (!supabase) throw new Error("File uploads aren't available yet.");
      for (const file of Array.from(files)) {
        if (file.size > MAX_BYTES) throw new Error(`${file.name} is over 25 MB.`);
        setStatus(`Uploading ${file.name}…`);
        const startRes = await fetch("/api/dashboard/uploads", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "start", fileName: file.name, sizeBytes: file.size })
        });
        const start = await startRes.json().catch(() => null);
        if (!startRes.ok) throw new Error(start?.error || "Upload failed");
        const { error: upErr } = await supabase.storage.from(start.bucket).uploadToSignedUrl(start.path, start.token, file);
        if (upErr) throw new Error(`Upload of ${file.name} failed. Please try again.`);
        const finishRes = await fetch("/api/dashboard/uploads", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "finish",
            path: start.path,
            fileName: file.name,
            mimeType: file.type || undefined,
            sizeBytes: file.size,
            intakeId: intakeId || undefined
          })
        });
        if (!finishRes.ok) throw new Error("Upload failed");
      }
      setStatus("Uploaded.");
      router.refresh();
    } catch (err) {
      setStatus(null);
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        void upload(e.dataTransfer.files);
      }}
      className={`grid justify-items-center gap-3 rounded-[20px] border-2 border-dashed bg-white p-8 text-center ${
        dragging ? "border-green bg-green-tint" : "border-[#9CC9B4]"
      }`}
    >
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#2D7B5F" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M12 16V4" />
        <path d="M7 9l5-5 5 5" />
        <path d="M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3" />
      </svg>
      <h2 className="text-[20px] font-extrabold">Drop files here or browse</h2>
      <span className="text-[14px] text-muted">PDF, Word, Excel, PowerPoint, CSV, text or images · up to 25 MB each</span>
      {problemSpaces.length > 0 && (
        <div className="grid justify-items-center gap-[6px]">
          <label htmlFor="upload-ps" className="text-[14px] font-semibold">
            Add to problem space
          </label>
          <select
            id="upload-ps"
            value={intakeId}
            onChange={(e) => setIntakeId(e.target.value)}
            className="rounded-xl border border-line3 bg-white px-[14px] py-[10px]"
          >
            {problemSpaces.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}
              </option>
            ))}
            <option value="">General (no problem space)</option>
          </select>
        </div>
      )}
      <input ref={inputRef} type="file" multiple accept={accept} className="hidden" onChange={(e) => upload(e.target.files)} />
      <button
        type="button"
        disabled={busy}
        onClick={() => inputRef.current?.click()}
        className="rounded-full bg-green px-6 py-3 font-semibold text-white hover:bg-forest disabled:opacity-60"
      >
        {busy ? "Uploading…" : "Choose files"}
      </button>
      <div aria-live="polite" className="min-h-[20px] text-[14px]">
        {status && <span className="text-green">{status}</span>}
        {error && <span className="font-semibold text-[#9B2C2C]">{error}</span>}
      </div>
    </div>
  );
}
