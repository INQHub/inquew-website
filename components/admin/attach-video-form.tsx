"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

export function AttachVideoForm({ intakeId }: { intakeId: string }) {
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
    formData.append("video", file);
    const res = await fetch(`/api/admin/intakes/${intakeId}/attach-video`, { method: "POST", body: formData });
    const data = await res.json();
    setUploading(false);
    if (!res.ok) {
      setMessage(data.message || data.error || "Upload failed");
      return;
    }
    router.refresh();
  }

  return (
    <div>
      <input ref={inputRef} type="file" accept="video/*" className="hidden" onChange={onChange} />
      <button
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className="rounded-[10px] border border-line3 px-4 py-2 text-[13.5px] font-semibold disabled:opacity-60"
      >
        {uploading ? "Uploading…" : "Attach a video recorded outside the platform"}
      </button>
      {message && <p className="mt-2 text-[13px] text-red-700">{message}</p>}
    </div>
  );
}
