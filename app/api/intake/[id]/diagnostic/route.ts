import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import {
  isStatementDraftingConfigured,
  generateDiagnosticQuestions,
  writeDiagnosis,
  keywordFallbackRecommendation,
  type CatalogRef
} from "@/lib/ai";
import {
  MAGIC_WAND_QUESTION,
  MAX_AI_QUESTIONS,
  FALLBACK_QUESTIONS,
  canAccessIntake,
  readQA,
  readQuestions,
  readContext,
  type DiagnosticQA
} from "@/lib/diagnostic";
import { getPlanUsage, quotaErrorBody, saveDiagnosisWithinQuota, QuotaExceededError } from "@/lib/subscriptions";

// Question writing and the final diagnosis are single Claude calls, but give them room.
export const maxDuration = 60;

const bodySchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("questions") }),
  z.object({ action: z.literal("answers"), answers: z.array(z.string().max(5000)).max(10) }),
  z.object({
    action: z.literal("context"),
    context: z.object({
      website: z.string().max(300).optional(),
      industry: z.string().max(100).optional(),
      department: z.string().max(100).optional(),
      role: z.string().max(100).optional()
    })
  }),
  z.object({ action: z.literal("finalize") })
]);

type CatalogRow = CatalogRef & { tier: number };

/** Puts a Tier 1 "Start here" deliverable first, adding the best-matching one if none was picked. */
function withStartHere(slugs: string[], catalog: CatalogRow[], text: string): string[] {
  const tierOf = new Map(catalog.map((c) => [c.slug, c.tier]));
  const list = slugs.filter((s) => tierOf.has(s));
  const firstTier1 = list.find((s) => tierOf.get(s) === 1);
  if (firstTier1) return [firstTier1, ...list.filter((s) => s !== firstTier1)].slice(0, 3);
  const tier1 = keywordFallbackRecommendation(text, catalog.filter((c) => c.tier === 1), 1);
  return [...tier1, ...list].slice(0, 3);
}

function fallbackSummary(statement: string, qa: DiagnosticQA[]): string {
  const quotes = qa
    .filter((q) => q.answer.trim())
    .slice(0, 2)
    .map((q) => `You said "${q.answer.trim().slice(0, 160)}${q.answer.trim().length > 160 ? "…" : ""}"`);
  return [
    `The problem you chose to work on: ${statement}`,
    quotes.length ? `${quotes.join(". ")}.` : "",
    "The recommended deliverables below are the most direct ways to address it. Start with the Tier 1 item: it's the lowest-cost way to get a clear picture before you invest in a larger fix."
  ]
    .filter(Boolean)
    .join("\n\n");
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  const intake = await prisma.intakeSession.findUnique({ where: { id } });
  if (!intake || !canAccessIntake(intake, session)) {
    return NextResponse.json({ error: "Intake session not found" }, { status: 404 });
  }

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  const body = parsed.data;

  const chosen = intake.chosenId ? await prisma.problemStatement.findUnique({ where: { id: intake.chosenId } }) : null;
  if (!chosen) return NextResponse.json({ error: "Choose a problem statement first" }, { status: 409 });

  if (body.action === "questions") {
    let questions = readQuestions(intake.diagnosticQuestions);
    if (!questions.length) {
      let aiQuestions: string[] = [];
      if (isStatementDraftingConfigured()) {
        try {
          aiQuestions = await generateDiagnosticQuestions(intake.transcript ?? "", chosen.text);
        } catch (err) {
          console.error("diagnostic question generation failed; using fallback", err);
        }
      }
      if (!aiQuestions.length) aiQuestions = FALLBACK_QUESTIONS;
      questions = [...aiQuestions.slice(0, MAX_AI_QUESTIONS), MAGIC_WAND_QUESTION];
      await prisma.intakeSession.update({ where: { id }, data: { diagnosticQuestions: questions } });
    }
    return NextResponse.json({ statement: chosen.text, questions });
  }

  if (body.action === "answers") {
    const questions = readQuestions(intake.diagnosticQuestions);
    if (!questions.length) return NextResponse.json({ error: "No questions yet" }, { status: 409 });
    const qa: DiagnosticQA[] = questions.map((question, i) => ({ question, answer: (body.answers[i] ?? "").trim() }));
    await prisma.intakeSession.update({ where: { id }, data: { diagnosticAnswers: qa } });
    return NextResponse.json({ ok: true });
  }

  if (body.action === "context") {
    const ctx = Object.fromEntries(Object.entries(body.context).map(([k, v]) => [k, v?.trim() || undefined]));
    await prisma.intakeSession.update({ where: { id }, data: { businessContext: ctx } });
    return NextResponse.json({ ok: true });
  }

  // finalize: results live behind an account, so this needs a signed-in user. An anonymous
  // intake is claimed by the account that finishes it.
  if (!session?.user?.id) return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  if (!intake.userId) {
    await prisma.intakeSession.update({ where: { id }, data: { userId: session.user.id } });
  }

  if (intake.diagnosedAt) return NextResponse.json({ id });

  // Each diagnosis counts against the owner's plan. Check before the slow AI call; the
  // allowance is claimed for real when the diagnosis is saved below.
  const ownerId = intake.userId ?? session.user.id;
  const usage = await getPlanUsage(ownerId);
  if (!usage || usage.remaining <= 0) {
    return NextResponse.json(usage ? quotaErrorBody(usage) : { error: "Account not found" }, { status: usage ? 402 : 404 });
  }

  const catalog: CatalogRow[] = await prisma.deliverable.findMany({
    where: { active: true },
    select: { slug: true, title: true, teaser: true, category: true, keyword: true, tier: true }
  });
  const qa = readQA(intake.diagnosticAnswers);
  const context = readContext(intake.businessContext);
  const allText = [chosen.text, intake.transcript ?? "", ...qa.map((q) => q.answer)].join(" ");

  let summary: string | null = null;
  let slugs: string[] = [];
  if (isStatementDraftingConfigured()) {
    try {
      const result = await writeDiagnosis({ statement: chosen.text, transcript: intake.transcript ?? "", qa, context, catalog });
      summary = result.summary;
      slugs = result.recommendedSlugs;
    } catch (err) {
      console.error("diagnosis generation failed; using fallback", err);
    }
  }
  if (!summary) summary = fallbackSummary(chosen.text, qa);
  if (!slugs.length) slugs = keywordFallbackRecommendation(allText, catalog, 3);

  try {
    await saveDiagnosisWithinQuota(ownerId, id, {
      diagnosisSummary: summary,
      recommendedSlugs: withStartHere(slugs, catalog, allText),
      diagnosedAt: new Date(),
      status: "COMPLETE"
    });
  } catch (err) {
    if (err instanceof QuotaExceededError) return NextResponse.json(quotaErrorBody(err.usage), { status: 402 });
    throw err;
  }

  return NextResponse.json({ id });
}
