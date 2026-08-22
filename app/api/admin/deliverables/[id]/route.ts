import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";
import { logAdminAction } from "@/lib/audit";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { response } = await requireAdmin();
  if (response) return response;
  const { id } = await params;
  const item = await prisma.deliverable.findUnique({ where: { id } });
  if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(item);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { session, response } = await requireAdmin();
  if (response) return response;
  const { id } = await params;

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") return NextResponse.json({ error: "Invalid body" }, { status: 400 });

  // Whitelist writable fields — this endpoint also serves the "raw JSON" editor, so
  // strip anything that isn't a real column (id, timestamps, relations) rather than
  // trusting the client's JSON wholesale.
  const { id: _id, createdAt: _c, updatedAt: _u, ...rest } = body;
  try {
    const item = await prisma.deliverable.update({ where: { id }, data: rest });
    await logAdminAction({ adminId: session!.user.id, action: "update", targetType: "Deliverable", targetId: id, metadata: rest });
    return NextResponse.json(item);
  } catch (err) {
    console.error("deliverable update failed", err);
    return NextResponse.json({ error: "Update failed — check field types" }, { status: 400 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { session, response } = await requireAdmin();
  if (response) return response;
  const { id } = await params;

  await prisma.deliverable.update({ where: { id }, data: { active: false } });
  await logAdminAction({ adminId: session!.user.id, action: "deactivate", targetType: "Deliverable", targetId: id });
  return NextResponse.json({ ok: true });
}
