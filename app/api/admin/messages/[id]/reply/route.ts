import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";
import { logAdminAction } from "@/lib/audit";
import { sendEmail, isEmailConfigured } from "@/lib/email";

const schema = z.object({
  reply: z.string().min(1).max(4000)
});

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { session, response } = await requireAdmin();
  if (response) return response;
  const { id } = await params;

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Write a reply before sending." }, { status: 400 });

  if (!isEmailConfigured()) {
    return NextResponse.json({ error: "Email isn't configured yet (RESEND_API_KEY/EMAIL_FROM missing)." }, { status: 503 });
  }

  const original = await prisma.contactMessage.findUnique({ where: { id } });
  if (!original) return NextResponse.json({ error: "Message not found." }, { status: 404 });

  const sendResult = await sendEmail({
    to: original.email,
    subject: "Re: your message to Inquew",
    html: `<p>${parsed.data.reply.replace(/\n/g, "<br>")}</p><hr><p style="color:#8A8468;font-size:13px">On ${original.createdAt.toLocaleString("en-US")}, you wrote: ${original.message}</p>`
  });

  if (!sendResult.delivered) {
    return NextResponse.json({ error: "Could not send the reply — try again in a moment." }, { status: 502 });
  }

  const message = await prisma.contactMessage.update({
    where: { id },
    data: { replyText: parsed.data.reply, repliedAt: new Date(), handled: true, handledAt: new Date() }
  });

  await logAdminAction({
    adminId: session!.user.id,
    action: "reply_sent",
    targetType: "ContactMessage",
    targetId: id
  });

  return NextResponse.json({ ok: true, replyText: message.replyText, repliedAt: message.repliedAt, handled: message.handled });
}
