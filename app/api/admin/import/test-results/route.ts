import { NextRequest, NextResponse } from "next/server";
import Papa from "papaparse";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";
import { logAdminAction } from "@/lib/audit";

export async function POST(req: NextRequest) {
  const { session, response } = await requireAdmin();
  if (response) return response;

  const formData = await req.formData().catch(() => null);
  const file = formData?.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "file is required" }, { status: 400 });

  const text = await file.text();
  const isJson = file.name.toLowerCase().endsWith(".json");

  let rows: unknown[];
  if (isJson) {
    const parsed = JSON.parse(text);
    rows = Array.isArray(parsed) ? parsed : [parsed];
  } else {
    const result = Papa.parse(text, { header: true, skipEmptyLines: true });
    if (result.errors.length) {
      return NextResponse.json({ error: `CSV parse error: ${result.errors[0].message}` }, { status: 400 });
    }
    rows = result.data;
  }

  const summary = {
    rowCount: rows.length,
    columns: rows.length && typeof rows[0] === "object" ? Object.keys(rows[0] as object) : []
  };

  const record = await prisma.testResultImport.create({
    data: {
      fileName: file.name,
      format: isJson ? "json" : "csv",
      rowCount: rows.length,
      rows: rows as any,
      summary
    }
  });

  await logAdminAction({ adminId: session!.user.id, action: "import_test_results", targetType: "TestResultImport", targetId: record.id, metadata: summary });

  return NextResponse.json({ id: record.id, rowCount: record.rowCount, summary });
}
