"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function MessageRowControls({ messageId, handled }: { messageId: string; handled: boolean }) {
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  async function toggle() {
    setSaving(true);
    await fetch(`/api/admin/messages/${messageId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ handled: !handled })
    });
    setSaving(false);
    router.refresh();
  }

  return (
    <button
      onClick={toggle}
      disabled={saving}
      className="rounded-lg border border-line3 px-3 py-1.5 text-[13px] font-semibold"
    >
      {handled ? "Mark unhandled" : "Mark handled"}
    </button>
  );
}
