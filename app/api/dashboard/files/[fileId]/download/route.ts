import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createSignedDownloadUrl, isSupabaseConfigured, BUCKETS } from "@/lib/supabase";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ fileId: string }> }) {
  const { fileId } = await params;
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

  const file = await prisma.deliverableFile.findUnique({
    where: { id: fileId },
    include: { orderLine: { include: { order: true } } }
  });
  if (!file) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const ownerId = file.orderLine?.order.userId;
  if (ownerId !== session.user.id && session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "not_configured", message: "File storage isn't configured yet — set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY." },
      { status: 503 }
    );
  }

  try {
    const url = await createSignedDownloadUrl(BUCKETS.deliverableFiles, file.storageKey);
    return NextResponse.json({ url });
  } catch (err) {
    console.error("signed download url failed", err);
    return NextResponse.json({ error: "Could not generate a download link" }, { status: 502 });
  }
}
