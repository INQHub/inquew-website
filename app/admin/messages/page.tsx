import { prisma } from "@/lib/prisma";
import { MessageRowControls } from "@/components/admin/message-row-controls";

export default async function AdminMessagesPage({
  searchParams
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  const sp = await searchParams;
  const filter = sp.filter === "handled" ? "handled" : sp.filter === "all" ? "all" : "unhandled";

  const [messages, unhandledCount, totalCount] = await Promise.all([
    prisma.contactMessage.findMany({
      where: filter === "all" ? undefined : { handled: filter === "handled" },
      orderBy: { createdAt: "desc" }
    }),
    prisma.contactMessage.count({ where: { handled: false } }),
    prisma.contactMessage.count()
  ]);

  const tabs = [
    { key: "unhandled", label: "Unhandled", count: unhandledCount },
    { key: "handled", label: "Handled", count: totalCount - unhandledCount },
    { key: "all", label: "All", count: totalCount }
  ];

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-[32px] font-bold">Messages</h1>
          <p className="mt-2 text-muted">Contact form submissions from the site.</p>
        </div>
        <div className="flex gap-2">
          {tabs.map((tab) => (
            <a
              key={tab.key}
              href={`/admin/messages?filter=${tab.key}`}
              className="rounded-full border border-line3 px-4 py-2 text-[13px] font-semibold"
              style={{
                background: filter === tab.key ? "#26300A" : "transparent",
                color: filter === tab.key ? "#FFFFFF" : "inherit"
              }}
            >
              {tab.label} ({tab.count})
            </a>
          ))}
        </div>
      </div>

      {messages.length === 0 ? (
        <p className="mt-8 text-muted">No messages here.</p>
      ) : (
        <div className="mt-6 grid gap-4">
          {messages.map((m) => (
            <div key={m.id} className="rounded-[20px] border border-line bg-white p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="font-semibold">
                    {m.name} <span className="font-normal text-muted">&lt;{m.email}&gt;</span>
                  </div>
                  <div className="mt-1 text-[12.5px] text-faint">
                    {new Date(m.createdAt).toLocaleString("en-US", {
                      dateStyle: "medium",
                      timeStyle: "short"
                    })}
                    {m.skipIntake && " · Requested to skip intake"}
                  </div>
                </div>
                <MessageRowControls messageId={m.id} handled={m.handled} />
              </div>
              <p className="mt-4 whitespace-pre-wrap text-[14.5px] leading-relaxed">{m.message}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
