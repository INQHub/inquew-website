import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { toPublic } from "@/lib/queries/deliverables";

export async function GET() {
  const rows = await prisma.deliverable.findMany({ where: { active: true }, orderBy: { sortOrder: "asc" } });
  return NextResponse.json(rows.map(toPublic));
}
