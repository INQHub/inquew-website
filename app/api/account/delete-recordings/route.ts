import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getSupabaseAdmin, isSupabaseConfigured, BUCKETS } from "@/lib/supabase";

/**
 * Deletes the client's intake recordings and transcripts: the video files in storage as
 * well as the database references, so nothing is left behind in the bucket.
 */
export async function POST() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

  const intakes = await prisma.intakeSession.findMany({
    where: { userId: session.user.id },
    select: { id: true, videoKey: true }
  });
  const keys = intakes.map((i) => i.videoKey).filter((k): k is string => !!k);

  if (keys.length && isSupabaseConfigured()) {
    const { error } = await getSupabaseAdmin().storage.from(BUCKETS.intakeVideos).remove(keys);
    if (error) {
      console.error("recording delete failed", error);
      return NextResponse.json({ error: "We couldn't delete your recordings. Please try again." }, { status: 502 });
    }
  }

  const result = await prisma.intakeSession.updateMany({
    where: { userId: session.user.id },
    data: { transcript: null, videoKey: null }
  });

  return NextResponse.json({ ok: true, cleared: result.count });
}
