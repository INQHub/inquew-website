import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { coverUrl } from "@/lib/case-studies";
import { CaseStudyForm } from "@/components/admin/case-study-form";

export const dynamic = "force-dynamic";

export default async function EditCaseStudyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const cs = await prisma.caseStudy.findUnique({ where: { id } });
  if (!cs) notFound();

  return (
    <div className="grid gap-6">
      <div>
        <Link href="/admin/case-studies" className="text-[13.5px] font-semibold text-green">
          ← All case studies
        </Link>
        <h1 className="mt-2 text-[32px] font-bold">{cs.title}</h1>
      </div>
      <CaseStudyForm
        id={cs.id}
        initialCoverUrl={await coverUrl(cs.coverKey)}
        initial={{
          title: cs.title,
          slug: cs.slug,
          industry: cs.industry,
          summary: cs.summary,
          problem: cs.problem,
          result: cs.result,
          body: cs.body,
          coverKey: cs.coverKey,
          published: cs.published
        }}
      />
    </div>
  );
}
