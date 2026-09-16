import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";

export async function POST() {
  const { response } = await requireAdmin();
  if (response) return response;

  await prisma.adminNotification.updateMany({
    where: { read: false },
    data: { read: true, readAt: new Date() }
  });

  return NextResponse.json({ ok: true });
}
