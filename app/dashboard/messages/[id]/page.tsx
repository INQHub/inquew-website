import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { MessageComposer } from "@/components/portal/message-composer";
import { ThreadMessages } from "@/components/portal/thread-view";

export default async function ThreadPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  const thread = await prisma.clientThread.findUnique({
    where: { id },
    include: { messages: { orderBy: { createdAt: "asc" } } }
  });
  if (!thread || thread.userId !== session!.user.id) notFound();
  if (thread.clientUnread) await prisma.clientThread.update({ where: { id }, data: { clientUnread: false } });

  return (
    <div className="grid max-w-[860px] gap-5">
      <Link href="/dashboard/messages" className="text-[14px] font-semibold">
        Back to messages
      </Link>
      <div className="overflow-hidden rounded-[20px] border border-line bg-white">
        <div className="border-b border-line px-6 py-4">
          <h1 className="text-[22px] font-bold">{thread.subject}</h1>
          <p className="text-[14px] text-muted">With the Inquew team</p>
        </div>
        <div className="p-6">
          <ThreadMessages messages={thread.messages} viewer="client" clientName="You" />
        </div>
        <div className="border-t border-line p-6">
          <MessageComposer endpoint={`/api/dashboard/threads/${thread.id}/messages`} placeholder="Write a reply" submitLabel="Send reply" />
        </div>
      </div>
    </div>
  );
}
