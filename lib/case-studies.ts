import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { BUCKETS, createSignedDownloadUrl, isSupabaseConfigured } from "@/lib/supabase";
import { CASE_STUDY_PREFIX } from "@/lib/uploads";

export function slugify(text: string) {
  return text
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

/** The essay body is plain text; blank lines separate paragraphs. No HTML is ever rendered. */
export function paragraphs(text: string) {
  return text
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
}

export const caseStudySchema = z.object({
  title: z.string().trim().min(3).max(160),
  slug: z
    .string()
    .trim()
    .max(80)
    .optional()
    .transform((s) => (s ? slugify(s) : "")),
  industry: z.string().trim().min(2).max(80),
  summary: z.string().trim().min(10).max(400),
  problem: z.string().trim().min(10).max(2000),
  result: z.string().trim().min(10).max(2000),
  body: z.string().trim().min(20).max(40000),
  // Only keys issued by our own cover-upload route are accepted.
  coverKey: z
    .string()
    .max(300)
    .nullable()
    .optional()
    .refine((k) => !k || k.startsWith(`${CASE_STUDY_PREFIX}/`), "Invalid image"),
  published: z.boolean().default(false)
});

export type CaseStudyInput = z.infer<typeof caseStudySchema>;

/** Signed link to the cover image (bucket is private). Null when there's no image or storage. */
export async function coverUrl(coverKey: string | null | undefined) {
  if (!coverKey || !isSupabaseConfigured()) return null;
  try {
    return await createSignedDownloadUrl(BUCKETS.deliverableFiles, coverKey, 60 * 60 * 2);
  } catch (err) {
    console.error("case study cover url failed", err);
    return null;
  }
}

export async function getPublishedCaseStudies() {
  try {
    return await prisma.caseStudy.findMany({ where: { published: true }, orderBy: { publishedAt: "desc" } });
  } catch (err) {
    // Before the migration is applied the table doesn't exist; show the placeholder page instead.
    console.error("case studies query failed", err);
    return [];
  }
}

export async function getPublishedCaseStudy(slug: string) {
  try {
    return await prisma.caseStudy.findFirst({ where: { slug, published: true } });
  } catch {
    return null;
  }
}
