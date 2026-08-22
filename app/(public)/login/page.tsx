"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const callbackUrl = params.get("callbackUrl") || "/dashboard";

  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [name, setName] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      if (mode === "signup") {
        const res = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, email, password, businessName })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Could not create account");
      }

      const result = await signIn("credentials", { email, password, redirect: false });
      if (result?.error) throw new Error("Incorrect email or password");
      router.push(callbackUrl);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="mx-auto max-w-[460px] px-7 pb-20 pt-[72px]">
      <h1 className="text-[36px] font-bold">{mode === "signin" ? "Sign in" : "Create your account"}</h1>
      <p className="mt-3 text-[15px] text-muted">
        {mode === "signin" ? "Access your dashboard, orders, and downloads." : "You'll need an account to check out and receive deliverables."}
      </p>

      <form onSubmit={submit} className="mt-7 grid gap-4 rounded-[20px] border border-line bg-white p-7">
        {mode === "signup" && (
          <>
            <Field label="Full name">
              <input required value={name} onChange={(e) => setName(e.target.value)} className="w-full rounded-[11px] border border-line3 px-[14px] py-[13px] outline-none focus:border-green" />
            </Field>
            <Field label="Business name (optional)">
              <input value={businessName} onChange={(e) => setBusinessName(e.target.value)} className="w-full rounded-[11px] border border-line3 px-[14px] py-[13px] outline-none focus:border-green" />
            </Field>
          </>
        )}
        <Field label="Email">
          <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full rounded-[11px] border border-line3 px-[14px] py-[13px] outline-none focus:border-green" />
        </Field>
        <Field label="Password">
          <input required type="password" minLength={mode === "signup" ? 8 : undefined} value={password} onChange={(e) => setPassword(e.target.value)} className="w-full rounded-[11px] border border-line3 px-[14px] py-[13px] outline-none focus:border-green" />
        </Field>
        {error && <p className="text-[13.5px] text-red-700">{error}</p>}
        <button
          type="submit"
          disabled={submitting}
          className="rounded-[13px] bg-cyan py-4 text-[16px] font-semibold text-cyan-ink hover:bg-cyan-hover disabled:opacity-60"
        >
          {submitting ? "Please wait…" : mode === "signin" ? "Sign in" : "Create account"}
        </button>
      </form>

      <button
        onClick={() => {
          setMode((m) => (m === "signin" ? "signup" : "signin"));
          setError(null);
        }}
        className="mt-5 text-[14px] font-semibold text-green"
      >
        {mode === "signin" ? "Need an account? Create one" : "Already have an account? Sign in"}
      </button>
    </section>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
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
