import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";
import { logAdminAction } from "@/lib/audit";

const schema = z.object({
  role: z.enum(["CLIENT", "ADMIN"]).optional(),
  active: z.boolean().optional()
});

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { session, response } = await requireAdmin();
  if (response) return response;
  const { id } = await params;

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  if (id === session!.user.id && parsed.data.role === "CLIENT") {
    return NextResponse.json({ error: "You can't remove your own admin access." }, { status: 400 });
  }

  const user = await prisma.user.update({ where: { id }, data: parsed.data });
  await logAdminAction({ adminId: session!.user.id, action: "update", targetType: "User", targetId: id, metadata: parsed.data });
  return NextResponse.json({ id: user.id, role: user.role, active: user.active });
}
