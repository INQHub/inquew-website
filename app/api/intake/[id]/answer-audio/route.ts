import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { isTranscriptionConfigured, transcribeVideo } from "@/lib/ai";
import { canAccessIntake } from "@/lib/diagnostic";

export const maxDuration = 60;

// A spoken answer of a minute or two is well under this as compressed audio; it also keeps
// the request under Vercel's ~4.5MB body limit.
const MAX_BYTES = 4 * 1024 * 1024;

/** Transcribes one recorded diagnostic answer and returns the text for the client to review. */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  const intake = await prisma.intakeSession.findUnique({ where: { id } });
  if (!intake || !canAccessIntake(intake, session)) {
    return NextResponse.json({ error: "Intake session not found" }, { status: 404 });
  }
  if (!isTranscriptionConfigured()) {
    return NextResponse.json({ error: "Voice answers aren't available yet. Please type your answer." }, { status: 503 });
  }

  const form = await req.formData().catch(() => null);
  const audio = form?.get("audio");
  if (!(audio instanceof Blob) || audio.size === 0) {
    return NextResponse.json({ error: "No recording received" }, { status: 400 });
  }
  if (audio.size > MAX_BYTES) {
    return NextResponse.json({ error: "That recording is too long. Try a shorter answer." }, { status: 413 });
  }

  try {
    const text = await transcribeVideo(Buffer.from(await audio.arrayBuffer()), "answer.webm");
    return NextResponse.json({ text });
  } catch (err) {
    console.error("answer transcription failed", err);
    return NextResponse.json({ error: "We couldn't transcribe that. Please try again or type your answer." }, { status: 502 });
  }
}
