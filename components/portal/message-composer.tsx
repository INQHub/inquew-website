"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

/**
 * Message box used in the client portal (new conversation or reply) and in the admin
 * panel (staff reply). Posts JSON to `endpoint`, then refreshes or opens the thread.
 */
export function MessageComposer({
  endpoint,
  withSubject = false,
  placeholder = "Write a message",
  submitLabel = "Send",
  openThreadBase,
  note = "Messages can add context, but change requests are only included if the deliverable says so."
}: {
  endpoint: string;
  withSubject?: boolean;
  placeholder?: string;
  submitLabel?: string;
  /** For new conversations: where to go after sending, e.g. "/dashboard/messages/". */
  openThreadBase?: string;
  note?: string | null;
}) {
  const router = useRouter();
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(withSubject ? { subject, body } : { body })
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || "Could not send your message");
      setBody("");
      setSubject("");
      if (openThreadBase && data?.id) router.push(`${openThreadBase}${data.id}`);
      else router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={send} className="grid gap-3">
      {withSubject && (
        <div className="grid gap-[6px]">
          <label htmlFor="msg-subject" className="text-[14px] font-semibold text-[#36423B]">
            Subject
          </label>
          <input
            id="msg-subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            maxLength={150}
            placeholder="What's this about?"
            className="w-full rounded-xl border border-line3 px-[14px] py-3 outline-none focus:border-green"
          />
        </div>
      )}
      <label htmlFor="msg-body" className="sr-only">
        Message
      </label>
      <textarea
        id="msg-body"
        rows={4}
        required
        value={body}
        onChange={(e) => setBody(e.target.value)}
        maxLength={5000}
        placeholder={placeholder}
        className="w-full resize-y rounded-xl border border-line3 px-[14px] py-3 outline-none focus:border-green"
      />
      {error && <p className="text-[13.5px] font-semibold text-[#9B2C2C]">{error}</p>}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {note ? <span className="text-[12.5px] text-faint">{note}</span> : <span />}
        <button
          type="submit"
          disabled={busy || !body.trim()}
          className="rounded-full bg-green px-5 py-[11px] font-semibold text-white hover:bg-forest disabled:opacity-60"
        >
          {busy ? "Sending…" : submitLabel}
        </button>
      </div>
    </form>
  );
}
