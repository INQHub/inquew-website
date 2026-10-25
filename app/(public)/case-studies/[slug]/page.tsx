import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { coverUrl, getPublishedCaseStudy, paragraphs } from "@/lib/case-studies";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const cs = await getPublishedCaseStudy(slug);
  return cs ? { title: `${cs.title} — Inquew case study`, description: cs.summary } : { title: "Case study — Inquew" };
}

export default async function CaseStudyPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const cs = await getPublishedCaseStudy(slug);
  if (!cs) notFound();
  const cover = await coverUrl(cs.coverKey);

  return (
    <article>
      <header className="bg-forest">
        <div className="mx-auto max-w-[860px] px-6 py-14">
          <Link href="/case-studies" className="text-[14px] font-semibold text-sky hover:text-aqua">
            ← All case studies
          </Link>
          <span className="mt-6 block text-[13px] font-bold uppercase tracking-[0.08em] text-[#C4D6CA]">{cs.industry}</span>
          <h1 className="mt-2 text-[40px] font-extrabold leading-[1.12] text-white">{cs.title}</h1>
          <p className="mt-4 text-[18px] text-[#DCE8E0]">{cs.summary}</p>
        </div>
      </header>

      <div className="mx-auto grid max-w-[860px] gap-10 px-6 py-12">
        {cover && <img src={cover} alt="" className="w-full rounded-[20px] object-cover" />}

        <div className="grid gap-5 sm:grid-cols-2">
          <div className="rounded-[20px] border border-line bg-sand p-6">
            <h2 className="text-[13px] font-bold uppercase tracking-[0.08em] text-olive">The problem</h2>
            <p className="mt-2 whitespace-pre-line text-[16px] text-ink">{cs.problem}</p>
          </div>
          <div className="rounded-[20px] border border-green bg-green-tint p-6">
            <h2 className="text-[13px] font-bold uppercase tracking-[0.08em] text-green">The result</h2>
            <p className="mt-2 whitespace-pre-line text-[16px] text-ink">{cs.result}</p>
          </div>
        </div>

        <div className="grid gap-5 text-[17px] leading-[1.7] text-[#36423B]">
          {paragraphs(cs.body).map((p, i) => (
            <p key={i} className="whitespace-pre-line">
              {p}
            </p>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-6 rounded-[20px] bg-sand p-8">
          <img src="/assets/mascots/plane.png" alt="" className="h-[72px] w-auto" />
          <div className="min-w-0 flex-[1_1_320px]">
            <h2 className="text-[22px] font-bold">Find what&apos;s slowing your business down</h2>
            <p className="mt-1 text-muted">Your first diagnostic is free. Start with a two-minute video about what&apos;s not working.</p>
          </div>
          <Link href="/intake" className="rounded-full bg-forest px-6 py-[14px] font-semibold text-white hover:bg-green hover:text-white">
            Start your free diagnostic
          </Link>
        </div>
      </div>
    </article>
  );
}
