import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AdminCaseStudiesPage() {
  const items = await prisma.caseStudy.findMany({ orderBy: { updatedAt: "desc" } });
  const fmt = (d: Date) => d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-[32px] font-bold">Case studies</h1>
          <p className="mt-2 text-muted">Published case studies appear on the public Case Studies page.</p>
        </div>
        <Link href="/admin/case-studies/new" className="rounded-full bg-forest px-5 py-3 font-semibold text-white hover:bg-green hover:text-white">
          New case study
        </Link>
      </div>

      <div className="mt-6 overflow-x-auto rounded-[20px] border border-line bg-white">
        <table className="w-full min-w-[640px] text-[14px]">
          <thead>
            <tr className="border-b border-line2 bg-sand text-left text-[11.5px] font-bold uppercase tracking-[0.06em] text-faint">
              <th className="px-5 py-3">Title</th>
              <th className="px-5 py-3">Industry</th>
              <th className="px-5 py-3">Status</th>
              <th className="px-5 py-3">Updated</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 && (
              <tr>
                <td colSpan={4} className="px-5 py-8 text-muted">
                  No case studies yet. Until one is published, the public page shows &ldquo;coming soon&rdquo; cards.
                </td>
              </tr>
            )}
            {items.map((c) => (
              <tr key={c.id} className="border-b border-[#F3F1E7] hover:bg-[#F7F8F5]">
                <td className="px-5 py-3">
                  <Link href={`/admin/case-studies/${c.id}`} className="font-semibold text-ink hover:text-green">
                    {c.title}
                  </Link>
                  <div className="text-[12px] text-faint">/case-studies/{c.slug}</div>
                </td>
                <td className="px-5 py-3 text-muted">{c.industry}</td>
                <td className="px-5 py-3">
                  {c.published ? (
                    <span className="rounded-full bg-[#EAF3EE] px-[10px] py-[4px] text-[11.5px] font-semibold text-forest">Published</span>
                  ) : (
                    <span className="rounded-full bg-sand px-[10px] py-[4px] text-[11.5px] font-semibold text-muted">Draft</span>
                  )}
                </td>
                <td className="px-5 py-3 text-muted">{fmt(c.updatedAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
