import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { notifyAdmins } from "@/lib/notifications";

const schema = z.object({
  name: z.string().min(1).max(200),
  email: z.string().email(),
  message: z.string().min(1).max(4000),
  skipIntake: z.boolean().optional()
});

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Please fill in your name, a valid email, and a message." }, { status: 400 });
  }
  const message = await prisma.contactMessage.create({ data: parsed.data });
  await notifyAdmins({
    type: "NEW_MESSAGE",
    title: `New message from ${message.name}`,
    body: message.message.length > 200 ? `${message.message.slice(0, 200)}…` : message.message,
    link: "/admin/messages"
  });
  return NextResponse.json({ ok: true, id: message.id });
}
