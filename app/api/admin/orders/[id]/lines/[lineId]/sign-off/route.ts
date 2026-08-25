import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";
import { logAdminAction } from "@/lib/audit";

const schema = z.object({ signedOff: z.boolean() });

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string; lineId: string }> }) {
  const { session, response } = await requireAdmin();
  if (response) return response;
  const { lineId } = await params;

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const line = await prisma.orderLine.update({
    where: { id: lineId },
    data: parsed.data.signedOff
      ? { completedById: session!.user.id, completedAt: new Date() }
      : { completedById: null, completedAt: null },
    include: { completedBy: { select: { name: true, email: true } } }
  });
  await logAdminAction({
    adminId: session!.user.id,
    action: parsed.data.signedOff ? "sign_off" : "undo_sign_off",
    targetType: "OrderLine",
    targetId: lineId
  });
  return NextResponse.json(line);
}
