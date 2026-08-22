"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

export function TestImportForm() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const router = useRouter();

  async function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setMessage(null);
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch("/api/admin/import/test-results", { method: "POST", body: formData });
    const data = await res.json();
    setUploading(false);
    e.target.value = "";
    if (!res.ok) {
      setMessage(data.error || "Import failed");
      return;
    }
    setMessage(`Imported ${data.rowCount} rows.`);
    router.refresh();
  }

  return (
    <div>
      <input ref={inputRef} type="file" accept=".csv,.json" className="hidden" onChange={onChange} />
      <button
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className="rounded-xl border border-line3 bg-white px-4 py-[10px] text-[13.5px] font-semibold disabled:opacity-60"
      >
        {uploading ? "Importing…" : "Import CSV or JSON"}
      </button>
      {message && <p className="mt-2 text-[13px] text-muted">{message}</p>}
    </div>
  );
}
