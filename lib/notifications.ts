import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";
import type { AdminNotificationType } from "@prisma/client";

function baseUrl() {
  return (process.env.NEXTAUTH_URL ?? "http://localhost:3000").replace(/\/$/, "");
}

/**
 * Records an admin notification and emails every active admin. Used for events an
 * admin needs to act on promptly (a new order, a new contact message) rather than
 * discover on their next manual check of the panel.
 */
export async function notifyAdmins(input: {
  type: AdminNotificationType;
  title: string;
  body: string;
  link: string;
  replyTo?: string;
}) {
  await prisma.adminNotification.create({
    data: { type: input.type, title: input.title, body: input.body, link: input.link }
  });

  try {
    const admins = await prisma.user.findMany({
      where: { role: "ADMIN", active: true },
      select: { email: true }
    });
    await Promise.all(
      admins.map((admin) =>
        sendEmail({
          to: admin.email,
          subject: input.title,
          html: `<p>${input.body}</p><p><a href="${baseUrl()}${input.link}">${baseUrl()}${input.link}</a></p>${
            input.replyTo ? `<p>Hit reply on this email to respond directly to them.</p>` : ""
          }`,
          replyTo: input.replyTo
        })
      )
    );
  } catch (err) {
    // Notifications must never break the flow they're attached to (order webhook, contact form).
    console.error("notifyAdmins email failed", err);
  }
}

export async function getUnreadNotificationCount() {
  return prisma.adminNotification.count({ where: { read: false } });
}
