import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";
import { logAdminAction } from "@/lib/audit";
import { addThreadMessage, MAX_MESSAGE_LENGTH } from "@/lib/messages";

const schema = z.object({ body: z.string().trim().min(1).max(MAX_MESSAGE_LENGTH) });

/** Inquew team replies to a client thread; the client gets an email pointing to the portal. */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { session, response } = await requireAdmin();
  if (response) return response;
  const { id } = await params;

  const thread = await prisma.clientThread.findUnique({ where: { id }, select: { id: true } });
  if (!thread) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Write a reply first." }, { status: 400 });

  await addThreadMessage({ threadId: id, authorId: session!.user.id, fromStaff: true, body: parsed.data.body });
  await logAdminAction({ adminId: session!.user.id, action: "client_thread.reply", targetType: "ClientThread", targetId: id });
  return NextResponse.json({ ok: true });
}
