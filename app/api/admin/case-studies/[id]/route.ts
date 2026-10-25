import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";
import { logAdminAction } from "@/lib/audit";
import { caseStudySchema, slugify } from "@/lib/case-studies";
import { BUCKETS, getSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabase";

async function removeImage(key: string | null) {
  if (!key || !isSupabaseConfigured()) return;
  const { error } = await getSupabaseAdmin().storage.from(BUCKETS.deliverableFiles).remove([key]);
  if (error) console.error("case study image delete failed", error);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { session, response } = await requireAdmin();
  if (response) return response;
  const { id } = await params;
  const existing = await prisma.caseStudy.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const parsed = caseStudySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Check the form", field: parsed.error.issues[0]?.path[0] }, { status: 400 });
  }
  const d = parsed.data;
  const slug = d.slug || slugify(d.title);
  const clash = await prisma.caseStudy.findUnique({ where: { slug } });
  if (clash && clash.id !== id) {
    return NextResponse.json({ error: "Another case study already uses that web address.", field: "slug" }, { status: 409 });
  }

  const cs = await prisma.caseStudy.update({
    where: { id },
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
      // Keep the original publish date when re-saving; clear it when unpublished.
      publishedAt: d.published ? existing.publishedAt ?? new Date() : null
    }
  });
  if (existing.coverKey && existing.coverKey !== cs.coverKey) await removeImage(existing.coverKey);

  await logAdminAction({
    adminId: session!.user.id,
    action: "case_study.update",
    targetType: "CaseStudy",
    targetId: id,
    metadata: { published: cs.published }
  });
  revalidatePath("/case-studies");
  revalidatePath(`/case-studies/${existing.slug}`);
  revalidatePath(`/case-studies/${cs.slug}`);
  return NextResponse.json({ id: cs.id, slug: cs.slug });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { session, response } = await requireAdmin();
  if (response) return response;
  const { id } = await params;
  const existing = await prisma.caseStudy.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.caseStudy.delete({ where: { id } });
  await removeImage(existing.coverKey);
  await logAdminAction({ adminId: session!.user.id, action: "case_study.delete", targetType: "CaseStudy", targetId: id, metadata: { title: existing.title } });
  revalidatePath("/case-studies");
  return NextResponse.json({ ok: true });
}
