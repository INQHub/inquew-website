"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function UserRowControls({ userId, role, active }: { userId: string; role: string; active: boolean }) {
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  async function update(data: { role?: string; active?: boolean }) {
    setSaving(true);
    await fetch(`/api/admin/users/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });
    setSaving(false);
    router.refresh();
  }

  return (
    <div className="flex items-center gap-2">
      <select
        defaultValue={role}
        disabled={saving}
        onChange={(e) => update({ role: e.target.value })}
        className="rounded-lg border border-line3 px-2 py-1 text-[13px]"
      >
        <option value="CLIENT">Client</option>
        <option value="ADMIN">Admin</option>
      </select>
      <button
        onClick={() => update({ active: !active })}
        disabled={saving}
        className="rounded-lg border border-line3 px-2 py-1 text-[13px] font-semibold"
      >
        {active ? "Deactivate" : "Activate"}
      </button>
    </div>
  );
}
