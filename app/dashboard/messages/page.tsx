import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { MessageComposer } from "@/components/portal/message-composer";

export default async function MessagesPage() {
  const session = await auth();
  const threads = await prisma.clientThread.findMany({
    where: { userId: session!.user.id },
    orderBy: { lastMessageAt: "desc" },
    include: { messages: { orderBy: { createdAt: "desc" }, take: 1 } }
  });

  return (
    <div className="grid max-w-[980px] gap-6">
      <div className="flex flex-wrap items-center gap-4">
        <img src="/assets/mascots/envelope.png" alt="" className="h-[52px] w-auto" />
        <div>
          <h1 className="text-[32px] font-bold">Messages</h1>
          <p className="text-muted">Questions, extra context or updates between you and the Inquew team.</p>
        </div>
      </div>

      <section aria-labelledby="new-msg" className="rounded-[20px] border border-line bg-white p-6">
        <h2 id="new-msg" className="mb-3 text-[19px] font-bold">
          New message to Inquew
        </h2>
        <MessageComposer endpoint="/api/dashboard/threads" withSubject openThreadBase="/dashboard/messages/" />
      </section>

      <section aria-labelledby="threads" className="overflow-hidden rounded-[20px] border border-line bg-white">
        <h2 id="threads" className="border-b border-line px-6 py-4 text-[19px] font-bold">
          Conversations
        </h2>
        {threads.length === 0 && (
          <p className="px-6 py-8 text-muted">No messages yet. When the Inquew team writes to you, it shows up here.</p>
        )}
        {threads.map((t) => (
          <Link
            key={t.id}
            href={`/dashboard/messages/${t.id}`}
            className={`grid gap-1 border-b border-line px-6 py-4 text-ink last:border-b-0 hover:bg-sand hover:text-ink ${
              t.clientUnread ? "bg-green-tint" : ""
            }`}
          >
            <span className="flex flex-wrap items-center justify-between gap-2">
              <strong className="text-forest">{t.subject}</strong>
              <span className="text-[13px] text-muted">
                {t.lastMessageAt.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
              </span>
            </span>
            <span className="truncate text-[14px] text-muted">
              {t.messages[0]?.fromStaff ? "Inquew: " : "You: "}
              {t.messages[0]?.body}
            </span>
            {t.clientUnread && (
              <span className="justify-self-start rounded-full bg-sky px-2 text-[12px] font-bold text-forest">New reply</span>
            )}
          </Link>
        ))}
      </section>
    </div>
  );
}
