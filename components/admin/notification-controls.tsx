"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function NotificationRowControls({ notificationId, read }: { notificationId: string; read: boolean }) {
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  async function toggle() {
    setSaving(true);
    await fetch(`/api/admin/notifications/${notificationId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ read: !read })
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
      {read ? "Mark unread" : "Mark read"}
    </button>
  );
}

export function MarkAllReadButton() {
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  async function markAll() {
    setSaving(true);
    await fetch("/api/admin/notifications/mark-all-read", { method: "POST" });
    setSaving(false);
    router.refresh();
  }

  return (
    <button
      onClick={markAll}
      disabled={saving}
      className="rounded-full bg-green px-4 py-2 text-[13px] font-semibold text-white disabled:opacity-60"
    >
      Mark all read
    </button>
  );
}
