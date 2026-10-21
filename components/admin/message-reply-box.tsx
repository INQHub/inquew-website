"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function MessageReplyBox({
  messageId,
  recipientEmail,
  replyText,
  repliedAt
}: {
  messageId: string;
  recipientEmail: string;
  replyText: string | null;
  repliedAt: string | null;
}) {
  const [open, setOpen] = useState(false);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function send() {
    setError(null);
    setSending(true);
    const res = await fetch(`/api/admin/messages/${messageId}/reply`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reply })
    });
    const data = await res.json().catch(() => ({}));
    setSending(false);
    if (!res.ok) {
      setError(data.error || "Could not send the reply.");
      return;
    }
    setOpen(false);
    setReply("");
    router.refresh();
  }

  if (!open) {
    return (
      <div className="flex flex-col items-end gap-1">
        <button
          onClick={() => setOpen(true)}
          className="rounded-lg border border-line3 px-3 py-1.5 text-[13px] font-semibold"
        >
          {replyText ? "Reply again" : "Reply"}
        </button>
        {replyText && repliedAt && (
          <span className="text-[11.5px] text-faint">
            Replied {new Date(repliedAt).toLocaleDateString("en-US")}
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="w-full max-w-[420px] rounded-[14px] border border-line3 bg-sand p-3">
      <div className="text-[12.5px] text-faint">Replying to {recipientEmail} — sent from Inquew</div>
      <textarea
        autoFocus
        rows={4}
        value={reply}
        onChange={(e) => setReply(e.target.value)}
        placeholder="Write your reply…"
        className="mt-2 w-full resize-y rounded-[10px] border border-line3 bg-white px-3 py-2 text-[13.5px] outline-none focus:border-green"
      />
      {error && <p className="mt-1 text-[12.5px] text-red-700">{error}</p>}
      <div className="mt-2 flex justify-end gap-2">
        <button
          onClick={() => {
            setOpen(false);
            setError(null);
          }}
          className="rounded-lg px-3 py-1.5 text-[13px] font-semibold text-muted"
        >
          Cancel
        </button>
        <button
          onClick={send}
          disabled={sending || !reply.trim()}
          className="rounded-lg bg-green px-3 py-1.5 text-[13px] font-semibold text-white disabled:opacity-60"
        >
          {sending ? "Sending…" : "Send reply"}
        </button>
      </div>
    </div>
  );
}
