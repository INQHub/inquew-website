import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AdminClientMessagesPage() {
  const threads = await prisma.clientThread.findMany({
    orderBy: [{ staffUnread: "desc" }, { lastMessageAt: "desc" }],
    take: 200,
    include: {
      user: { select: { id: true, name: true, email: true, businessName: true } },
      messages: { orderBy: { createdAt: "desc" }, take: 1 }
    }
  });
  const unread = threads.filter((t) => t.staffUnread).length;

  return (
    <div>
      <h1 className="text-[32px] font-bold">Client messages</h1>
      <p className="mt-2 text-muted">
        {unread > 0 ? `${unread} waiting for a reply.` : "You're all caught up."} Clients get an email when you reply.
      </p>

      <ul className="mt-6 grid gap-3">
        {threads.length === 0 && <li className="rounded-[20px] border border-line bg-white p-6 text-muted">No client messages yet.</li>}
        {threads.map((t) => {
          const last = t.messages[0];
          return (
            <li key={t.id}>
              <Link
                href={`/admin/client-messages/${t.id}`}
                className={`grid gap-1 rounded-[18px] border bg-white p-5 hover:border-green-border ${t.staffUnread ? "border-sky" : "border-line"}`}
              >
                <div className="flex flex-wrap items-center gap-3">
                  <strong className="text-[16px] text-ink">{t.subject}</strong>
                  {t.staffUnread && <span className="rounded-full bg-sky px-[9px] py-[2px] text-[11px] font-bold text-forest">Needs reply</span>}
                  <span className="ml-auto text-[12.5px] text-faint">
                    {t.lastMessageAt.toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
                  </span>
                </div>
                <span className="text-[13px] text-muted">{t.user.businessName || t.user.name || t.user.email}</span>
                {last && (
                  <span className="line-clamp-2 text-[14px] text-[#36423B]">
                    {last.fromStaff ? "You: " : ""}
                    {last.body}
                  </span>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
