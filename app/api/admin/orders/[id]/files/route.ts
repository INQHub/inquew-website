import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";
import { logAdminAction } from "@/lib/audit";
import { isSupabaseConfigured, uploadServerSide, BUCKETS } from "@/lib/supabase";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { session, response } = await requireAdmin();
  if (response) return response;
  const { id: orderId } = await params;

  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "not_configured", message: "File storage isn't configured yet — set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY." },
      { status: 503 }
    );
  }

  const formData = await req.formData().catch(() => null);
  const file = formData?.get("file");
  const orderLineId = formData?.get("orderLineId");
  if (!(file instanceof File) || typeof orderLineId !== "string") {
    return NextResponse.json({ error: "file and orderLineId are required" }, { status: 400 });
  }

  const line = await prisma.orderLine.findFirst({ where: { id: orderLineId, orderId } });
  if (!line) return NextResponse.json({ error: "Order line not found" }, { status: 404 });

  const buffer = Buffer.from(await file.arrayBuffer());
  const storageKey = `${orderId}/${orderLineId}/${Date.now()}-${file.name}`;
  await uploadServerSide(BUCKETS.deliverableFiles, storageKey, buffer, file.type);

  const created = await prisma.deliverableFile.create({
    data: {
      orderLineId,
      deliverableId: line.deliverableId,
      uploadedById: session!.user.id,
      storageKey,
      fileName: file.name,
      mimeType: file.type,
      sizeBytes: buffer.byteLength
    }
  });

  await logAdminAction({ adminId: session!.user.id, action: "upload_file", targetType: "Order", targetId: orderId, metadata: { fileId: created.id } });
  return NextResponse.json(created, { status: 201 });
}
