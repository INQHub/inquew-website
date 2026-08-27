import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  isStatementDraftingConfigured,
  draftStatementsAndRecommendations,
  keywordFallbackRecommendation,
  type StatementDraft
} from "@/lib/ai";
import { getDeliverablesBySlugs } from "@/lib/queries/deliverables";

export const maxDuration = 30;

function fallbackStatements(transcript: string): StatementDraft[] {
  const gist = transcript.trim().slice(0, 160) || "a recurring operational bottleneck";
  return [
    { text: `Looking at it another way: ${gist}${gist.endsWith(".") ? "" : "."}`, angle: "Alternate restatement." },
    {
      text: "Handoffs between people or systems are informal, so information gets lost or work gets repeated.",
      angle: "Frames it as a handoff and communication problem."
    },
    {
      text: "The team adopted a new way of working without a rollout plan, so it didn't stick.",
      angle: "Frames it as an adoption problem."
    }
  ];
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const intake = await prisma.intakeSession.findUnique({ where: { id } });
  if (!intake) return NextResponse.json({ error: "Intake session not found" }, { status: 404 });

  const body = await req.json().catch(() => ({}));
  const catalog = await prisma.deliverable.findMany({
    where: { active: true },
    select: { slug: true, title: true, teaser: true, category: true, keyword: true }
  });

  if (body.action === "regenerate") {
    const transcript = intake.transcript ?? "";
    let statements: StatementDraft[];
    let recommendedSlugs: string[];
    if (isStatementDraftingConfigured()) {
      try {
        const result = await draftStatementsAndRecommendations(transcript, catalog);
        statements = result.statements;
        recommendedSlugs = result.recommendedSlugs;
      } catch {
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

    const recommended = await getDeliverablesBySlugs(recommendedSlugs);
    return NextResponse.json({
      setId: set.id,
      statements: set.statements.map((s) => ({ id: s.id, text: s.text, angle: s.angle })),
      recommended
    });
  }

  if (body.action === "select") {
    const statement = await prisma.problemStatement.findUnique({ where: { id: body.statementId } });
    if (!statement) return NextResponse.json({ error: "Statement not found" }, { status: 404 });

    await prisma.$transaction([
      prisma.problemStatement.updateMany({ where: { set: { sessionId: id } }, data: { selected: false } }),
      prisma.problemStatement.update({ where: { id: statement.id }, data: { selected: true } }),
      prisma.intakeSession.update({ where: { id }, data: { chosenId: statement.id, status: "STATEMENT_SELECTED" } })
    ]);

    return NextResponse.json({ ok: true, text: statement.text });
  }

  if (body.action === "custom") {
    const text = String(body.text ?? "").trim();
    if (!text) return NextResponse.json({ error: "text is required" }, { status: 400 });

    const set = await prisma.problemStatementSet.create({
      data: { sessionId: id, source: "manual", statements: { create: { text, selected: true } } },
      include: { statements: true }
    });

    await prisma.intakeSession.update({
      where: { id },
      data: { chosenId: set.statements[0].id, status: "STATEMENT_SELECTED" }
    });

    return NextResponse.json({ ok: true, text });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
