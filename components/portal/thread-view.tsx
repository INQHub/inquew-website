type Msg = { id: string; body: string; fromStaff: boolean; createdAt: Date };

/** Message bubbles for one thread. `viewer` decides which side is "you". */
export function ThreadMessages({ messages, viewer, clientName }: { messages: Msg[]; viewer: "client" | "staff"; clientName: string }) {
  return (
    <div className="grid gap-4">
      {messages.map((m) => {
        const mine = viewer === "staff" ? m.fromStaff : !m.fromStaff;
        const who = m.fromStaff ? (viewer === "staff" ? "Inquew team (you)" : "Inquew team") : viewer === "client" ? "You" : clientName;
        return (
          <div key={m.id} className={`grid max-w-[80%] gap-1 ${mine ? "justify-self-end" : "justify-self-start"}`}>
            <span className={`text-[13px] text-muted ${mine ? "text-right" : ""}`}>
              <strong className="text-forest">{who}</strong> ·{" "}
              {m.createdAt.toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
            </span>
            <div
              className={`whitespace-pre-line px-4 py-3 text-[15px] ${
                mine ? "rounded-[14px_14px_4px_14px] bg-forest text-white" : "rounded-[14px_14px_14px_4px] bg-green-tint text-ink"
              }`}
            >
              {m.body}
            </div>
          </div>
        );
      })}
    </div>
  );
}
