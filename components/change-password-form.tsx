"use client";

import { useState } from "react";

export function ChangePasswordForm() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (newPassword !== confirmPassword) {
      setError("New password and confirmation don't match.");
      return;
    }

    setSubmitting(true);
    const res = await fetch("/api/account/change-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword, newPassword })
    });
    const data = await res.json().catch(() => ({}));
    setSubmitting(false);

    if (!res.ok) {
      setError(data.error || "Could not change password.");
      return;
    }

    setSuccess(true);
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
  }

  return (
    <form onSubmit={submit} className="grid gap-4">
      <Field label="Current password">
        <input
          required
          type="password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          className="w-full rounded-[11px] border border-line3 px-[14px] py-[13px] outline-none focus:border-green"
        />
      </Field>
      <Field label="New password">
        <input
          required
          type="password"
          minLength={8}
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          className="w-full rounded-[11px] border border-line3 px-[14px] py-[13px] outline-none focus:border-green"
        />
      </Field>
      <Field label="Confirm new password">
        <input
          required
          type="password"
          minLength={8}
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className="w-full rounded-[11px] border border-line3 px-[14px] py-[13px] outline-none focus:border-green"
        />
      </Field>
      {error && <p className="text-[13.5px] text-red-700">{error}</p>}
      {success && <p className="text-[13.5px] text-green">Password changed.</p>}
      <button
        type="submit"
        disabled={submitting}
        className="rounded-[13px] bg-cyan py-3 text-[15px] font-semibold text-cyan-ink hover:bg-cyan-hover disabled:opacity-60"
      >
        {submitting ? "Saving…" : "Change password"}
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
