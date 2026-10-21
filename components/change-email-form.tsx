"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export function ChangeEmailForm({ currentEmail }: { currentEmail: string }) {
  const { update } = useSession();
  const router = useRouter();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newEmail, setNewEmail] = useState(currentEmail);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setSubmitting(true);

    const res = await fetch("/api/account/change-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword, newEmail })
    });
    const data = await res.json().catch(() => ({}));
    setSubmitting(false);

    if (!res.ok) {
      setError(data.error || "Could not change email.");
      return;
    }

    setSuccess(true);
    setCurrentPassword("");
    await update({ email: data.email });
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="grid gap-4">
      <Field label="New email">
        <input
          required
          type="email"
          value={newEmail}
          onChange={(e) => setNewEmail(e.target.value)}
          className="w-full rounded-[11px] border border-line3 px-[14px] py-[13px] outline-none focus:border-green"
        />
      </Field>
      <Field label="Current password">
        <input
          required
          type="password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          className="w-full rounded-[11px] border border-line3 px-[14px] py-[13px] outline-none focus:border-green"
        />
      </Field>
      {error && <p className="text-[13.5px] text-red-700">{error}</p>}
      {success && <p className="text-[13.5px] text-green">Email updated. You'll log in with this address next time.</p>}
      <button
        type="submit"
        disabled={submitting}
        className="rounded-[13px] bg-cyan py-3 text-[15px] font-semibold text-cyan-ink hover:bg-cyan-hover disabled:opacity-60"
      >
        {submitting ? "Saving…" : "Change email"}
      </button>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-[6px] text-[13px] font-semibold text-muted">{label}</div>
      {children}
    </div>
  );
}
