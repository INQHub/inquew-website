import OpenAI, { toFile } from "openai";
import Anthropic from "@anthropic-ai/sdk";

export function isTranscriptionConfigured() {
  return !!process.env.OPENAI_API_KEY;
}

export function isStatementDraftingConfigured() {
  return !!process.env.ANTHROPIC_API_KEY;
}

let _openai: OpenAI | null = null;
function openai() {
  if (!process.env.OPENAI_API_KEY) throw new Error("OpenAI is not configured — set OPENAI_API_KEY.");
  if (!_openai) _openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  return _openai;
}

let _anthropic: Anthropic | null = null;
function anthropic() {
  if (!process.env.ANTHROPIC_API_KEY) throw new Error("Anthropic is not configured — set ANTHROPIC_API_KEY.");
  if (!_anthropic) _anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  return _anthropic;
}

export async function transcribeVideo(buffer: Buffer, fileName: string): Promise<string> {
  const file = await toFile(buffer, fileName);
  const result = await openai().audio.transcriptions.create({
    file,
    model: "whisper-1"
  });
  return result.text;
}

export type StatementDraft = { text: string; angle: string };
export type CatalogRef = { slug: string; title: string; teaser: string; category: string; keyword: string };

const STATEMENT_SYSTEM_PROMPT = `You help a small-business consulting platform called Inquew turn a client's spoken description of a business problem into clear, distinct framings.

Given a transcript of a client describing a problem, and a menu of consulting deliverables, respond with ONLY a JSON object (no markdown fences, no commentary) matching this shape:

{
  "statements": [
    { "text": "one-sentence problem statement in plain language", "angle": "one short phrase naming the framing, e.g. 'Frames it as a measurement problem.'" },
    { "text": "...", "angle": "..." },
    { "text": "...", "angle": "..." }
  ],
  "recommendedSlugs": ["slug-one", "slug-two", "slug-three", "slug-four"]
}

Rules:
- Write exactly 3 statements, each a genuinely different angle on the same underlying problem (ownership, measurement, automation, communication, adoption, etc. — pick whichever 3 angles fit the transcript best).
- Each statement is one sentence, plain language, no consulting jargon.
- recommendedSlugs must contain 3–4 slugs chosen ONLY from the provided deliverable menu, ranked by how directly they answer the problem.
- If the transcript is empty, too short, or unclear, make reasonable general-business-operations assumptions rather than refusing.`;

export async function draftStatementsAndRecommendations(
  transcript: string,
  catalog: CatalogRef[]
): Promise<{ statements: StatementDraft[]; recommendedSlugs: string[] }> {
  const catalogList = catalog
    .map((c) => `- ${c.slug}: "${c.title}" (${c.category}) — ${c.teaser}`)
    .join("\n");

  const message = await anthropic().messages.create({
    model: "claude-sonnet-5",
    max_tokens: 1200,
    system: STATEMENT_SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: `Transcript:\n"""\n${transcript.slice(0, 8000)}\n"""\n\nDeliverable menu:\n${catalogList}`
      }
    ]
  });

  const textBlock = message.content.find((b): b is Anthropic.TextBlock => b.type === "text");
  if (!textBlock) throw new Error("Claude returned no text content");

  const parsed = parseStatementJson(textBlock.text);
  const validSlugs = new Set(catalog.map((c) => c.slug));
  const recommendedSlugs = parsed.recommendedSlugs.filter((s) => validSlugs.has(s)).slice(0, 4);

  return {
    statements: parsed.statements.slice(0, 3),
    recommendedSlugs: recommendedSlugs.length ? recommendedSlugs : keywordFallbackRecommendation(transcript, catalog)
  };
}

function parseStatementJson(raw: string): { statements: StatementDraft[]; recommendedSlugs: string[] } {
  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("Could not find JSON in Claude response");
  const parsed = JSON.parse(jsonMatch[0]);
  if (!Array.isArray(parsed.statements) || !Array.isArray(parsed.recommendedSlugs)) {
    throw new Error("Claude response missing expected fields");
  }
  return parsed;
}

/** Simple word-overlap scoring, used if the AI recommendation call fails or is unavailable. */
export function keywordFallbackRecommendation(transcript: string, catalog: CatalogRef[], limit = 4): string[] {
  const words = new Set(
    transcript
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter((w) => w.length > 3)
  );
  const scored = catalog.map((c) => {
    const haystack = `${c.title} ${c.teaser} ${c.category} ${c.keyword}`.toLowerCase();
    let score = 0;
    for (const w of words) if (haystack.includes(w)) score++;
    return { slug: c.slug, score };
  });
  scored.sort((a, b) => b.score - a.score);
  const top = scored.filter((s) => s.score > 0).slice(0, limit);
  if (top.length >= limit) return top.map((s) => s.slug);
  const fill = catalog.map((c) => c.slug).filter((s) => !top.some((t) => t.slug === s));
  return [...top.map((s) => s.slug), ...fill].slice(0, limit);
}
