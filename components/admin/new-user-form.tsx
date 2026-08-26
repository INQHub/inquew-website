"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function NewUserForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"ADMIN" | "CLIENT">("ADMIN");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<{ email: string; tempPassword: string } | null>(null);
  const [copied, setCopied] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const res = await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, role })
    });
    const data = await res.json().catch(() => ({}));
    setSubmitting(false);

    if (!res.ok) {
      setError(typeof data.error === "string" ? data.error : "Could not create account.");
      return;
    }

    setCreated({ email: data.email, tempPassword: data.tempPassword });
    setName("");
    setEmail("");
    router.refresh();
  }

  function copyPassword() {
    if (!created) return;
    navigator.clipboard.writeText(created.tempPassword).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function reset() {
    setCreated(null);
    setCopied(false);
    setOpen(false);
  }

  if (created) {
    return (
      <div className="mb-6 rounded-[20px] border border-line bg-white p-6">
        <h3 className="text-[17px] font-semibold">Account created</h3>
        <p className="mt-2 text-[14px] text-muted">
          Share this temporary password with <strong>{created.email}</strong> through a secure channel (not email). They'll be
          required to set their own password the first time they sign in.
        </p>
        <div className="mt-4 flex items-center gap-3">
          <code className="flex-1 rounded-[10px] border border-line3 bg-sand px-4 py-3 text-[15px] font-semibold tracking-wide">
            {created.tempPassword}
          </code>
          <button onClick={copyPassword} className="rounded-[10px] border border-line3 px-4 py-3 text-[13.5px] font-semibold">
            {copied ? "Copied" : "Copy"}
          </button>
        </div>
        <p className="mt-3 text-[12.5px] text-faint">This password won't be shown again.</p>
        <button onClick={reset} className="mt-4 rounded-[10px] bg-cyan px-4 py-2 text-[13.5px] font-semibold text-cyan-ink">
          Done
        </button>
      </div>
    );
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="mb-6 rounded-[11px] bg-cyan px-5 py-3 text-[14.5px] font-semibold text-cyan-ink hover:bg-cyan-hover"
      >
        + New admin
      </button>
    );
  }

  return (
    <form onSubmit={submit} className="mb-6 grid gap-4 rounded-[20px] border border-line bg-white p-6">
      <h3 className="text-[17px] font-semibold">New team account</h3>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <div className="mb-[6px] text-[13px] font-semibold text-muted">Full name</div>
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-[10px] border border-line3 px-3 py-2 outline-none focus:border-green"
          />
        </div>
        <div>
          <div className="mb-[6px] text-[13px] font-semibold text-muted">Email</div>
          <input
            required
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-[10px] border border-line3 px-3 py-2 outline-none focus:border-green"
          />
        </div>
      </div>
      <div>
        <div className="mb-[6px] text-[13px] font-semibold text-muted">Role</div>
        <select value={role} onChange={(e) => setRole(e.target.value as "ADMIN" | "CLIENT")} className="rounded-[10px] border border-line3 px-3 py-2">
          <option value="ADMIN">Admin</option>
          <option value="CLIENT">Client</option>
        </select>
      </div>
      {error && <p className="text-[13.5px] text-red-700">{error}</p>}
      <div className="flex items-center gap-3">
        <button type="submit" disabled={submitting} className="rounded-[10px] bg-cyan px-5 py-2.5 text-[14px] font-semibold text-cyan-ink disabled:opacity-60">
          {submitting ? "Creating…" : "Create account"}
        </button>
        <button type="button" onClick={() => setOpen(false)} className="text-[13.5px] text-muted">
          Cancel
        </button>
      </div>
    </form>
  );
}
