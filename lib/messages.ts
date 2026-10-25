import { prisma } from "@/lib/prisma";
import { notifyAdmins } from "@/lib/notifications";
import { sendEmail } from "@/lib/email";

function baseUrl() {
  return (process.env.NEXTAUTH_URL ?? "http://localhost:3000").replace(/\/$/, "");
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

export const MAX_MESSAGE_LENGTH = 5000;

/** Client starts a new conversation. Admins get an in-app notification and an email. */
export async function createClientThread(userId: string, subject: string, body: string) {
  const thread = await prisma.clientThread.create({
    data: {
      userId,
      subject,
      staffUnread: true,
      messages: { create: { authorId: userId, fromStaff: false, body } }
    },
    include: { user: { select: { name: true, email: true, businessName: true } } }
  });
  await notifyAdmins({
    type: "CLIENT_MESSAGE",
    title: `New client message: ${subject}`,
    body: `${thread.user.name ?? thread.user.email}${thread.user.businessName ? ` (${thread.user.businessName})` : ""} wrote: ${body.slice(0, 300)}`,
    link: `/admin/client-messages/${thread.id}`
  });
  return thread;
}

/** Adds a message to a thread and flags it unread for the other side. */
export async function addThreadMessage(input: { threadId: string; authorId: string; fromStaff: boolean; body: string }) {
  const thread = await prisma.clientThread.update({
    where: { id: input.threadId },
    data: {
      lastMessageAt: new Date(),
      ...(input.fromStaff ? { clientUnread: true, staffUnread: false } : { staffUnread: true, clientUnread: false }),
      messages: { create: { authorId: input.authorId, fromStaff: input.fromStaff, body: input.body } }
    },
    include: { user: { select: { name: true, email: true, businessName: true } } }
  });

  if (input.fromStaff) {
    // The client is told there's a reply; the message itself stays in the portal.
    await sendEmail({
      to: thread.user.email,
      subject: `Inquew replied: ${thread.subject}`,
      html: `<p>Hi ${escapeHtml(thread.user.name?.split(" ")[0] ?? "there")},</p><p>The Inquew team replied to your message "${escapeHtml(
        thread.subject
      )}".</p><p><a href="${baseUrl()}/dashboard/messages/${thread.id}">Read and reply in your dashboard</a></p>`
    }).catch((err) => console.error("client reply email failed", err));
  } else {
    await notifyAdmins({
      type: "CLIENT_MESSAGE",
      title: `Client replied: ${thread.subject}`,
      body: `${thread.user.name ?? thread.user.email} wrote: ${input.body.slice(0, 300)}`,
      link: `/admin/client-messages/${thread.id}`
    });
  }
  return thread;
}

export async function getUnreadClientThreadCount(userId: string) {
  return prisma.clientThread.count({ where: { userId, clientUnread: true } });
}

/** Client threads waiting on the Inquew team (admin sidebar badge). */
export async function getStaffUnreadThreadCount() {
  return prisma.clientThread.count({ where: { staffUnread: true } });
}
