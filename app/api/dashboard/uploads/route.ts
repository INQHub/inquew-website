import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { BUCKETS, createSignedUploadUrl, isSupabaseConfigured } from "@/lib/supabase";
import { CLIENT_UPLOAD_PREFIX, MAX_UPLOAD_BYTES, clientUploadPath, isAllowedUpload } from "@/lib/uploads";

const startSchema = z.object({
  action: z.literal("start"),
  fileName: z.string().min(1).max(300),
  sizeBytes: z.number().int().positive().max(MAX_UPLOAD_BYTES)
});
const finishSchema = z.object({
  action: z.literal("finish"),
  path: z.string().min(1).max(500),
  fileName: z.string().min(1).max(300),
  mimeType: z.string().max(200).optional(),
  sizeBytes: z.number().int().positive().max(MAX_UPLOAD_BYTES),
  intakeId: z.string().max(100).optional()
});

/**
 * Two-step upload so large files never pass through a serverless function:
 * "start" returns a signed URL for the browser to upload straight to storage,
 * "finish" records the file once the upload succeeded.
 */
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  const userId = session.user.id;
  const body = await req.json().catch(() => null);

  if (body?.action === "start") {
    const parsed = startSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Files can be up to 25 MB." }, { status: 400 });
    if (!isAllowedUpload(parsed.data.fileName)) {
      return NextResponse.json({ error: "Upload a PDF, Word, Excel, PowerPoint, CSV, text or image file." }, { status: 400 });
    }
    if (!isSupabaseConfigured()) return NextResponse.json({ error: "File storage isn't configured yet." }, { status: 503 });
    const path = clientUploadPath(userId, parsed.data.fileName);
    const { token } = await createSignedUploadUrl(BUCKETS.deliverableFiles, path);
    return NextResponse.json({ bucket: BUCKETS.deliverableFiles, path, token });
  }

  const parsed = finishSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid upload" }, { status: 400 });
  const input = parsed.data;
  // The path must be one this user was issued, so nobody can register someone else's file.
  if (!input.path.startsWith(`${CLIENT_UPLOAD_PREFIX}/${userId}/`)) {
    return NextResponse.json({ error: "Invalid upload" }, { status: 400 });
  }
  if (input.intakeId) {
    const intake = await prisma.intakeSession.findUnique({ where: { id: input.intakeId }, select: { userId: true } });
    if (intake?.userId !== userId) return NextResponse.json({ error: "Invalid problem space" }, { status: 400 });
  }

  const file = await prisma.clientFile.create({
    data: {
      userId,
      intakeId: input.intakeId || null,
      storageKey: input.path,
      fileName: input.fileName.slice(0, 300),
      mimeType: input.mimeType,
      sizeBytes: input.sizeBytes
    }
  });
  return NextResponse.json({ id: file.id });
}
