import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isSupabaseConfigured, createSignedUploadUrl, BUCKETS } from "@/lib/supabase";

/**
 * Recordings can run to 2 minutes of video, which comfortably exceeds Vercel's
 * ~4.5MB serverless request-body limit. The client uploads the file directly to
 * Supabase Storage using a signed URL from this route, then hands only the
 * storage path (a few bytes) to /transcribe.
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const intake = await prisma.intakeSession.findUnique({ where: { id } });
  if (!intake) return NextResponse.json({ error: "Intake session not found" }, { status: 404 });

  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "not_configured", message: "Direct upload isn't configured yet." },
      { status: 503 }
    );
  }

  const body = await req.json().catch(() => null);
  const fileName = typeof body?.fileName === "string" && body.fileName ? body.fileName : "intake-recording.webm";
  const path = `${id}/${Date.now()}-${fileName}`;

  try {
    const { path: signedPath, token } = await createSignedUploadUrl(BUCKETS.intakeVideos, path);
    return NextResponse.json({ bucket: BUCKETS.intakeVideos, path: signedPath, token });
  } catch (err) {
    console.error("failed to create signed upload url", err);
    return NextResponse.json({ error: "upload_url_failed", message: "Couldn't prepare the upload." }, { status: 502 });
  }
}
