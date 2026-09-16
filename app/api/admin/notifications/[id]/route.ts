import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { response } = await requireAdmin();
  if (response) return response;

  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const read = Boolean(body.read);

  const notification = await prisma.adminNotification.update({
    where: { id },
    data: { read, readAt: read ? new Date() : null }
  });

  return NextResponse.json({ notification });
}
