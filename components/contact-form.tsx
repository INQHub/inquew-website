"use client";

import { useState } from "react";

export function ContactForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [skipIntake, setSkipIntake] = useState(false);
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("sending");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, message, skipIntake })
      });
      if (!res.ok) throw new Error();
      setStatus("sent");
      setName("");
      setEmail("");
      setMessage("");
      setSkipIntake(false);
    } catch {
      setStatus("error");
    }
  };

  if (status === "sent") {
    return (
      <div className="grid gap-4 rounded-[20px] border border-line bg-white p-7 shadow-card">
        <h3 className="text-[19px] font-semibold text-green">Message sent</h3>
        <p className="text-[14.5px] text-muted">
          Thanks — we&apos;ll get back to you within one business day.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="grid gap-4 rounded-[20px] border border-line bg-white p-7 shadow-card">
      <Field label="Your name">
        <input
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Jane Okafor"
          className="w-full rounded-[11px] border border-line3 px-[14px] py-[13px] outline-none focus:border-green"
        />
      </Field>
      <Field label="Email">
        <input
          required
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="jane@company.com"
          className="w-full rounded-[11px] border border-line3 px-[14px] py-[13px] outline-none focus:border-green"
        />
      </Field>
      <Field label="What do you need?">
        <textarea
          required
          rows={5}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Describe it in plain language — no consulting vocabulary needed."
          className="w-full resize-y rounded-[11px] border border-line3 px-[14px] py-[13px] outline-none focus:border-green"
        />
      </Field>
      <label className="flex cursor-pointer items-start gap-[10px] text-[14px] text-muted">
        <input
          type="checkbox"
          checked={skipIntake}
          onChange={(e) => setSkipIntake(e.target.checked)}
          className="mt-1 h-[17px] w-[17px] accent-green"
        />
        <span>I&apos;d rather not use the video intake — contact me through the manual path instead.</span>
      </label>
      {status === "error" && <p className="text-[13.5px] text-red-700">Something went wrong — try again.</p>}
      <button
        type="submit"
        disabled={status === "sending"}
        className="rounded-xl bg-cyan px-[22px] py-[15px] text-[15.5px] font-semibold text-cyan-ink hover:bg-cyan-hover disabled:opacity-60"
      >
        {status === "sending" ? "Sending…" : "Send message"}
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
