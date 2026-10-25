import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { createClientThread, MAX_MESSAGE_LENGTH } from "@/lib/messages";

const schema = z.object({
  subject: z.string().trim().max(150).optional(),
  body: z.string().trim().min(1).max(MAX_MESSAGE_LENGTH)
});

/** Client starts a new conversation with the Inquew team. */
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Write a message first." }, { status: 400 });

  const subject = parsed.data.subject || parsed.data.body.split("\n")[0].slice(0, 80);
  const thread = await createClientThread(session.user.id, subject, parsed.data.body);
  return NextResponse.json({ id: thread.id });
}
