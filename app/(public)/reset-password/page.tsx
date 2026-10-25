"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

const inputCls = "w-full rounded-[11px] border border-line3 px-[14px] py-[13px] outline-none focus:border-green";

function ResetPasswordForm() {
  const token = useSearchParams().get("token") ?? "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) return setError("The two passwords don't match.");
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password })
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || "Something went wrong");
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="mx-auto max-w-[460px] px-7 pb-20 pt-[72px]">
      <h1 className="text-[36px] font-bold">Choose a new password</h1>
      {!token ? (
        <p className="mt-4 text-[15px] text-muted">
          This page needs the link from your reset email. <Link href="/forgot-password">Request a new link</Link>.
        </p>
      ) : done ? (
        <div role="status" className="mt-7 grid gap-4 rounded-[20px] border border-line bg-white p-7">
          <p className="text-[16px] font-semibold text-forest">Your password has been changed.</p>
          <Link href="/login" className="rounded-[13px] bg-cyan py-4 text-center text-[16px] font-semibold text-cyan-ink hover:bg-cyan-hover">
            Sign in
          </Link>
        </div>
      ) : (
        <form onSubmit={submit} className="mt-7 grid gap-4 rounded-[20px] border border-line bg-white p-7">
          <label>
            <div className="mb-[6px] text-[13px] font-semibold text-muted">New password (at least 8 characters)</div>
            <input required type="password" minLength={8} autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} className={inputCls} />
          </label>
          <label>
            <div className="mb-[6px] text-[13px] font-semibold text-muted">Type it again</div>
            <input required type="password" minLength={8} autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} className={inputCls} />
          </label>
          {error && (
            <p className="text-[13.5px] text-red-700">
              {error}
              {error.includes("expired") && (
                <>
                  {" "}
                  <Link href="/forgot-password">Send a new link</Link>
                </>
              )}
            </p>
          )}
          <button
            type="submit"
            disabled={submitting}
            className="rounded-[13px] bg-cyan py-4 text-[16px] font-semibold text-cyan-ink hover:bg-cyan-hover disabled:opacity-60"
          >
            {submitting ? "Please wait…" : "Save new password"}
          </button>
        </form>
      )}
    </section>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordForm />
    </Suspense>
  );
}
