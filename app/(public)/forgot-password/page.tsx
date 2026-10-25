"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

const inputCls = "w-full rounded-[11px] border border-line3 px-[14px] py-[13px] outline-none focus:border-green";

function ForgotPasswordForm() {
  const params = useSearchParams();
  const [email, setEmail] = useState(params.get("email") ?? "");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || "Something went wrong");
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="mx-auto max-w-[460px] px-7 pb-20 pt-[72px]">
      <h1 className="text-[36px] font-bold">Reset your password</h1>
      {sent ? (
        <div role="status" className="mt-7 grid gap-3 rounded-[20px] border border-line bg-white p-7">
          <p className="text-[16px] font-semibold text-forest">Check your email</p>
          <p className="text-[15px] text-muted">
            If there&apos;s an Inquew account for <strong className="text-ink">{email}</strong>, we&apos;ve sent it a link to choose a
            new password. The link expires in an hour. Don&apos;t see it? Check your spam folder.
          </p>
        </div>
      ) : (
        <>
          <p className="mt-3 text-[15px] text-muted">Enter the email you sign in with and we&apos;ll send you a link to choose a new password.</p>
          <form onSubmit={submit} className="mt-7 grid gap-4 rounded-[20px] border border-line bg-white p-7">
            <label>
              <div className="mb-[6px] text-[13px] font-semibold text-muted">Email</div>
              <input required type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputCls} />
            </label>
            {error && <p className="text-[13.5px] text-red-700">{error}</p>}
            <button
              type="submit"
              disabled={submitting}
              className="rounded-[13px] bg-cyan py-4 text-[16px] font-semibold text-cyan-ink hover:bg-cyan-hover disabled:opacity-60"
            >
              {submitting ? "Please wait…" : "Send reset link"}
            </button>
          </form>
        </>
      )}
      <Link href="/login" className="mt-5 inline-block text-[14px] font-semibold text-green">
        Back to sign in
      </Link>
    </section>
  );
}

export default function ForgotPasswordPage() {
  return (
    <Suspense>
      <ForgotPasswordForm />
    </Suspense>
  );
}
