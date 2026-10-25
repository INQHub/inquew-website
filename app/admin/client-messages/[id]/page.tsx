import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ThreadMessages } from "@/components/portal/thread-view";
import { MessageComposer } from "@/components/portal/message-composer";

export const dynamic = "force-dynamic";

export default async function AdminClientThreadPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const thread = await prisma.clientThread.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, name: true, email: true, businessName: true } },
      messages: { orderBy: { createdAt: "asc" } }
    }
  });
  if (!thread) notFound();
  if (thread.staffUnread) await prisma.clientThread.update({ where: { id }, data: { staffUnread: false } });

  const clientName = thread.user.name || thread.user.businessName || thread.user.email;

  return (
    <div className="grid max-w-[860px] gap-6">
      <div>
        <Link href="/admin/client-messages" className="text-[13.5px] font-semibold text-green">
          ← All client messages
        </Link>
        <h1 className="mt-2 text-[28px] font-bold">{thread.subject}</h1>
        <p className="mt-1 text-muted">
          With{" "}
          <Link href={`/admin/clients/${thread.user.id}`} className="font-semibold text-green">
            {clientName}
          </Link>{" "}
          · {thread.user.email}
        </p>
      </div>

      <section className="rounded-[20px] border border-line bg-white p-6">
        <ThreadMessages messages={thread.messages} viewer="staff" clientName={clientName} />
      </section>

      <section className="rounded-[20px] border border-line bg-white p-6">
        <h2 className="mb-3 text-[17px] font-semibold">Reply</h2>
        <MessageComposer
          endpoint={`/api/admin/client-threads/${thread.id}/messages`}
          placeholder="Write your reply to the client"
          submitLabel="Send reply"
          note="The client gets an email saying there's a new message in their portal. The message itself stays in the portal."
        />
      </section>
    </div>
  );
}
