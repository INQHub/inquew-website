import { NextRequest, NextResponse } from "next/server";
import Papa from "papaparse";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";

export async function GET(req: NextRequest) {
  const { response } = await requireAdmin();
  if (response) return response;

  const { searchParams } = new URL(req.url);
  const format = searchParams.get("format") === "csv" ? "csv" : "json";
  const days = Number(searchParams.get("days") ?? 30);
  const since = new Date(Date.now() - days * 86_400_000);

  const events = await prisma.engagementEvent.findMany({
    where: { createdAt: { gte: since } },
    orderBy: { createdAt: "desc" },
    take: 20000
  });

  if (format === "csv") {
    const rows = events.map((e) => ({
      id: e.id,
      type: e.type,
      userId: e.userId ?? "",
      anonId: e.anonId ?? "",
      path: e.path ?? "",
      synthetic: e.synthetic,
      createdAt: e.createdAt.toISOString(),
      metadata: e.metadata ? JSON.stringify(e.metadata) : ""
    }));
    const csv = Papa.unparse(rows);
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="inquew-events-${days}d.csv"`
      }
    });
  }

  return NextResponse.json(events, {
    headers: { "Content-Disposition": `attachment; filename="inquew-events-${days}d.json"` }
  });
}
