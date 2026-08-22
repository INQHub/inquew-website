import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";
import { logAdminAction } from "@/lib/audit";

const schema = z.object({
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/, "lowercase letters, numbers, and hyphens only"),
  tier: z.number().int().min(1).max(3),
  title: z.string().min(1),
  priceCents: z.number().int().min(0),
  teaser: z.string().min(1),
  description: z.string().min(1),
  category: z.string().min(1),
  keyword: z.string().min(1),
  videoAddon: z.enum(["NONE", "ADD", "INCLUDED"]),
  zoomAddon: z.enum(["NONE", "ADD", "INCLUDED"]),
  active: z.boolean().optional(),
  sortOrder: z.number().int().optional()
});

export async function GET() {
  const { response } = await requireAdmin();
  if (response) return response;

  const items = await prisma.deliverable.findMany({ orderBy: { sortOrder: "asc" } });
  return NextResponse.json(items);
}

export async function POST(req: NextRequest) {
  const { session, response } = await requireAdmin();
  if (response) return response;

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const existing = await prisma.deliverable.findUnique({ where: { slug: parsed.data.slug } });
  if (existing) return NextResponse.json({ error: "A deliverable with that slug already exists" }, { status: 409 });

  const item = await prisma.deliverable.create({ data: parsed.data });
  await logAdminAction({ adminId: session!.user.id, action: "create", targetType: "Deliverable", targetId: item.id });
  return NextResponse.json(item, { status: 201 });
}
