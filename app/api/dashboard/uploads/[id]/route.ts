import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { BUCKETS, createSignedDownloadUrl, getSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabase";

async function loadOwnedFile(id: string) {
  const session = await auth();
  if (!session?.user) return { error: NextResponse.json({ error: "Sign in required" }, { status: 401 }) };
  const file = await prisma.clientFile.findUnique({ where: { id } });
  // Admins may open client files (to do the work); only the owner may delete them.
  if (!file || (file.userId !== session.user.id && session.user.role !== "ADMIN")) {
    return { error: NextResponse.json({ error: "Not found" }, { status: 404 }) };
  }
  return { file, session };
}

/** A short-lived signed link to download one uploaded file. */
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const result = await loadOwnedFile(id);
  if (result.error) return result.error;
  if (!isSupabaseConfigured()) return NextResponse.json({ error: "File storage isn't configured yet." }, { status: 503 });
  const url = await createSignedDownloadUrl(BUCKETS.deliverableFiles, result.file.storageKey, 60 * 10);
  return NextResponse.json({ url });
}

/** Deletes the file from storage and from the client's library. */
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const result = await loadOwnedFile(id);
  if (result.error) return result.error;
  if (result.file.userId !== result.session.user.id) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (isSupabaseConfigured()) {
    const { error } = await getSupabaseAdmin().storage.from(BUCKETS.deliverableFiles).remove([result.file.storageKey]);
    if (error) {
      console.error("client file delete failed", error);
      return NextResponse.json({ error: "We couldn't delete that file. Please try again." }, { status: 502 });
    }
  }
  await prisma.clientFile.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
