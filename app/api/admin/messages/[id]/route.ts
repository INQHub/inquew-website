import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";
import { logAdminAction } from "@/lib/audit";

const schema = z.object({
  handled: z.boolean()
});

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { session, response } = await requireAdmin();
  if (response) return response;
  const { id } = await params;

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const message = await prisma.contactMessage.update({
    where: { id },
    data: { handled: parsed.data.handled, handledAt: parsed.data.handled ? new Date() : null }
  });
  await logAdminAction({
    adminId: session!.user.id,
    action: parsed.data.handled ? "mark_handled" : "mark_unhandled",
    targetType: "ContactMessage",
    targetId: id
  });
  return NextResponse.json({ id: message.id, handled: message.handled });
}
