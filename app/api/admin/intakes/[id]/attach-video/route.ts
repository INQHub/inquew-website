import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";
import { logAdminAction } from "@/lib/audit";
import { isSupabaseConfigured, uploadServerSide, BUCKETS } from "@/lib/supabase";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { session, response } = await requireAdmin();
  if (response) return response;
  const { id } = await params;

  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "not_configured", message: "File storage isn't configured yet — set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY." },
      { status: 503 }
    );
  }

  const formData = await req.formData().catch(() => null);
  const file = formData?.get("video");
  if (!(file instanceof File)) return NextResponse.json({ error: "video file is required" }, { status: 400 });

  const buffer = Buffer.from(await file.arrayBuffer());
  const storageKey = `${id}/manual-${Date.now()}-${file.name}`;
  await uploadServerSide(BUCKETS.intakeVideos, storageKey, buffer, file.type);

  await prisma.intakeSession.update({ where: { id }, data: { videoKey: storageKey } });
  await logAdminAction({ adminId: session!.user.id, action: "attach_video", targetType: "IntakeSession", targetId: id });

  return NextResponse.json({ ok: true, storageKey });
}
