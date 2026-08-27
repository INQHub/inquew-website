import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  isTranscriptionConfigured,
  isStatementDraftingConfigured,
  transcribeVideo,
  draftStatementsAndRecommendations,
  keywordFallbackRecommendation,
  type StatementDraft
} from "@/lib/ai";
import { isSupabaseConfigured, uploadServerSide, downloadServerSide, BUCKETS } from "@/lib/supabase";
import { getDeliverablesBySlugs } from "@/lib/queries/deliverables";

function fallbackStatements(transcript: string): StatementDraft[] {
  const gist = transcript.trim().slice(0, 160) || "a recurring operational bottleneck";
  return [
    {
      text: `Based on what you described, the core issue is: ${gist}${gist.endsWith(".") ? "" : "."}`,
      angle: "Direct restatement of what you said."
    },
    {
      text: "This looks like a process-visibility problem — it's unclear which steps are actually causing the delay or cost.",
      angle: "Frames it as a measurement problem."
    },
    {
      text: "Manual, repetitive work is eating time that could go toward higher-value tasks, and it hasn't been assessed for automation yet.",
      angle: "Frames it as an automation-opportunity problem."
    }
  ];
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const intake = await prisma.intakeSession.findUnique({ where: { id } });
  if (!intake) return NextResponse.json({ error: "Intake session not found" }, { status: 404 });

  if (!isTranscriptionConfigured()) {
    return NextResponse.json(
      { error: "not_configured", message: "Video transcription isn't configured yet — set OPENAI_API_KEY." },
      { status: 503 }
    );
  }

  await prisma.intakeSession.update({ where: { id }, data: { status: "UPLOADING" } });

  const contentType = req.headers.get("content-type") || "";
  let buffer: Buffer;
  let storageKey: string;

  if (contentType.includes("application/json")) {
    // Primary path: the client already uploaded the recording straight to Supabase
    // Storage via a signed URL (bypasses Vercel's serverless body-size limit), so
    // this request only carries the storage path.
    const body = await req.json().catch(() => null);
    if (!body?.path) {
      return NextResponse.json({ error: "A video (or audio) file is required." }, { status: 400 });
    }
    if (!isSupabaseConfigured()) {
      return NextResponse.json(
        { error: "not_configured", message: "Video storage isn't configured yet." },
        { status: 503 }
      );
    }
    try {
      buffer = await downloadServerSide(BUCKETS.intakeVideos, body.path);
    } catch (err) {
      console.error("failed to fetch uploaded recording from storage", err);
      return NextResponse.json(
        { error: "upload_failed", message: "Couldn't retrieve the uploaded recording — try recording again." },
        { status: 502 }
      );
    }
    storageKey = body.path;
  } else {
    // Legacy/fallback path (small files only, e.g. local dev without Supabase configured):
    // the file rides along in the request body itself.
    const formData = await req.formData().catch(() => null);
    const file = formData?.get("video");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "A video (or audio) file is required." }, { status: 400 });
    }
    buffer = Buffer.from(await file.arrayBuffer());
    const fileName = file.name || "intake-recording.webm";
    storageKey = `${id}/${fileName}`;
    if (isSupabaseConfigured()) {
      uploadServerSide(BUCKETS.intakeVideos, storageKey, buffer, file.type).catch((err) =>
        console.error("intake video upload failed (non-fatal)", err)
      );
    }
  }

  await prisma.intakeSession.update({ where: { id }, data: { status: "TRANSCRIBING" } });

  let transcript: string;
  try {
    transcript = await transcribeVideo(buffer, storageKey.split("/").pop() || "intake-recording.webm");
  } catch (err) {
    console.error("transcription failed", err);
    await prisma.intakeSession.update({
      where: { id },
      data: { status: "FAILED", errorMessage: "Transcription failed" }
    });
    return NextResponse.json({ error: "transcription_failed", message: "Transcription failed — try again." }, { status: 502 });
  }

  const catalog = await prisma.deliverable.findMany({
    where: { active: true },
    select: { slug: true, title: true, teaser: true, category: true, keyword: true }
  });

  let statements: StatementDraft[];
  let recommendedSlugs: string[];
  if (isStatementDraftingConfigured()) {
    try {
      const result = await draftStatementsAndRecommendations(transcript, catalog);
      statements = result.statements;
      recommendedSlugs = result.recommendedSlugs;
    } catch (err) {
      console.error("Claude statement drafting failed, using fallback", err);
      statements = fallbackStatements(transcript);
      recommendedSlugs = keywordFallbackRecommendation(transcript, catalog);
    }
  } else {
    statements = fallbackStatements(transcript);
    recommendedSlugs = keywordFallbackRecommendation(transcript, catalog);
  }

  const set = await prisma.problemStatementSet.create({
    data: {
      sessionId: id,
      source: isStatementDraftingConfigured() ? "ai" : "ai-fallback",
      statements: { create: statements.map((s) => ({ text: s.text, angle: s.angle })) }
    },
    include: { statements: true }
  });

  await prisma.intakeSession.update({
    where: { id },
    data: { status: "TRANSCRIBED", videoKey: storageKey, transcript }
  });

  const recommended = await getDeliverablesBySlugs(recommendedSlugs);

  return NextResponse.json({
    transcript,
    setId: set.id,
    statements: set.statements.map((s) => ({ id: s.id, text: s.text, angle: s.angle })),
    recommended
  });
}
