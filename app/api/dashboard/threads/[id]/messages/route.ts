import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { addThreadMessage, MAX_MESSAGE_LENGTH } from "@/lib/messages";

const schema = z.object({ body: z.string().trim().min(1).max(MAX_MESSAGE_LENGTH) });

/** Client replies in one of their own threads. */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

  const thread = await prisma.clientThread.findUnique({ where: { id }, select: { userId: true } });
  if (!thread || thread.userId !== session.user.id) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Write a message first." }, { status: 400 });

  await addThreadMessage({ threadId: id, authorId: session.user.id, fromStaff: false, body: parsed.data.body });
  return NextResponse.json({ ok: true });
}
