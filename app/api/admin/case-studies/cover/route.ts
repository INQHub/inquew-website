import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/require-admin";
import { BUCKETS, createSignedUploadUrl, isSupabaseConfigured } from "@/lib/supabase";
import { caseStudyImagePath, isAllowedImage } from "@/lib/uploads";

const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
const startSchema = z.object({ action: z.literal("start"), fileName: z.string().min(1).max(300), sizeBytes: z.number().int().positive().max(MAX_IMAGE_BYTES) });

/** Issues a signed upload URL so the cover image goes straight from the browser to storage. */
export async function POST(req: NextRequest) {
  const { response } = await requireAdmin();
  if (response) return response;
  if (!isSupabaseConfigured()) return NextResponse.json({ error: "File storage isn't configured yet." }, { status: 503 });
  const body = await req.json().catch(() => null);

  const parsed = startSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Images can be up to 8 MB." }, { status: 400 });
  if (!isAllowedImage(parsed.data.fileName)) return NextResponse.json({ error: "Use a PNG, JPG or WebP image." }, { status: 400 });
  const path = caseStudyImagePath(parsed.data.fileName);
  const { token } = await createSignedUploadUrl(BUCKETS.deliverableFiles, path);
  return NextResponse.json({ bucket: BUCKETS.deliverableFiles, path, token });
}
