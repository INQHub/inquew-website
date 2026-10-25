import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";
import { logAdminAction } from "@/lib/audit";
import { caseStudySchema, slugify } from "@/lib/case-studies";

export async function POST(req: NextRequest) {
  const { session, response } = await requireAdmin();
  if (response) return response;

  const parsed = caseStudySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Check the form" , field: parsed.error.issues[0]?.path[0] }, { status: 400 });
  }
  const d = parsed.data;
  const slug = d.slug || slugify(d.title);
  if (!slug) return NextResponse.json({ error: "Add a title", field: "title" }, { status: 400 });
  if (await prisma.caseStudy.findUnique({ where: { slug } })) {
    return NextResponse.json({ error: "Another case study already uses that web address.", field: "slug" }, { status: 409 });
  }

  const cs = await prisma.caseStudy.create({
    data: {
      title: d.title,
      slug,
      industry: d.industry,
      summary: d.summary,
      problem: d.problem,
      result: d.result,
      body: d.body,
      coverKey: d.coverKey ?? null,
      published: d.published,
      publishedAt: d.published ? new Date() : null
    }
  });
  await logAdminAction({ adminId: session!.user.id, action: "case_study.create", targetType: "CaseStudy", targetId: cs.id });
  return NextResponse.json({ id: cs.id, slug: cs.slug });
}
