import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";
import { logAdminAction } from "@/lib/audit";

const schema = z.object({
  status: z.enum(["PENDING_PAYMENT", "PAID", "ASSIGNED", "IN_REVIEW", "AWAITING_CLIENT_REVIEW", "DELIVERED", "CANCELLED"]).optional(),
  progressPct: z.number().int().min(0).max(100).optional(),
  deliveryMethod: z.enum(["DASHBOARD", "EMAIL"]).optional()
});

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { session, response } = await requireAdmin();
  if (response) return response;
  const { id } = await params;

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const order = await prisma.order.update({ where: { id }, data: parsed.data });
  await logAdminAction({ adminId: session!.user.id, action: "update", targetType: "Order", targetId: id, metadata: parsed.data });
  return NextResponse.json(order);
}
