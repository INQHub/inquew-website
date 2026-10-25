import type { IntakeSession } from "@prisma/client";
import type { Session } from "next-auth";

/** Always the last diagnostic question. */
export const MAGIC_WAND_QUESTION =
  "If you had a magic wand, what would your business look like, or how would this problem be solved?";

/** At most this many AI-written questions, plus the magic-wand question (7 total). */
export const MAX_AI_QUESTIONS = 6;

export const FALLBACK_QUESTIONS = [
  "When does this problem show up most, and how often?",
  "Who on your team is affected by it, and how?",
  "What does it cost you today in time, money or customers?",
  "What have you already tried, and what happened?",
  "What tools or software are involved in this part of the work?",
  "If this were fixed, how would you know? What would you measure?"
];

export type DiagnosticQA = { question: string; answer: string };

export type BusinessContext = {
  website?: string;
  industry?: string;
  department?: string;
  role?: string;
};

export const INDUSTRIES = [
  "Agriculture",
  "Construction",
  "E-commerce",
  "Education",
  "Finance",
  "Food",
  "Government & Public Administration",
  "Healthcare",
  "Home Services",
  "Hospitality",
  "Legal",
  "Logistics",
  "Manufacturing",
  "Media",
  "Professional Services",
  "Real Estate & Property Management",
  "Retail",
  "Technology",
  "Transportation",
  "Other"
];
export const DEPARTMENTS = ["Owner / leadership", "Operations", "Field operations", "Office and admin", "Sales", "Finance", "Other"];

/** Short human-readable code for a problem space, e.g. PS-8K2QF. */
export function problemCode(intakeId: string): string {
  return "PS-" + intakeId.slice(-5).toUpperCase();
}

/**
 * An intake that already belongs to an account is only usable by that account (or an
 * admin). An anonymous intake, before its account gate, is usable by whoever holds its
 * unguessable id — the browser that started it.
 */
export function canAccessIntake(intake: Pick<IntakeSession, "userId">, session: Session | null): boolean {
  if (!intake.userId) return true;
  if (!session?.user) return false;
  return session.user.id === intake.userId || session.user.role === "ADMIN";
}

export function readQA(value: unknown): DiagnosticQA[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((v): v is { question: unknown; answer: unknown } => !!v && typeof v === "object")
    .map((v) => ({ question: String(v.question ?? ""), answer: String(v.answer ?? "") }))
    .filter((v) => v.question);
}

export function readQuestions(value: unknown): string[] {
  return Array.isArray(value) ? value.map(String).filter(Boolean) : [];
}

export function readContext(value: unknown): BusinessContext {
  if (!value || typeof value !== "object") return {};
  const v = value as Record<string, unknown>;
  const str = (k: string) => (typeof v[k] === "string" && v[k] ? (v[k] as string) : undefined);
  return { website: str("website"), industry: str("industry"), department: str("department"), role: str("role") };
}
