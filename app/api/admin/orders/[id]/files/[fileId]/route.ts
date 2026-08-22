import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";
import { logAdminAction } from "@/lib/audit";

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string; fileId: string }> }) {
  const { session, response } = await requireAdmin();
  if (response) return response;
  const { fileId } = await params;

  await prisma.deliverableFile.delete({ where: { id: fileId } });
  await logAdminAction({ adminId: session!.user.id, action: "delete_file", targetType: "DeliverableFile", targetId: fileId });
  return NextResponse.json({ ok: true });
}
