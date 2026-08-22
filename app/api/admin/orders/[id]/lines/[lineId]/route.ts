import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";
import { logAdminAction } from "@/lib/audit";

const schema = z.object({ editsUsed: z.number().int().min(0) });

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string; lineId: string }> }) {
  const { session, response } = await requireAdmin();
  if (response) return response;
  const { lineId } = await params;

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const line = await prisma.orderLine.update({ where: { id: lineId }, data: { editsUsed: parsed.data.editsUsed } });
  await logAdminAction({ adminId: session!.user.id, action: "update", targetType: "OrderLine", targetId: lineId, metadata: parsed.data });
  return NextResponse.json(line);
}
