import Link from "next/link";
import { getDeliverablesBySlugs, getCatalogStats } from "@/lib/queries/deliverables";
import { TEASER_SLUGS } from "@/prisma/catalog-data";
import { TIER_COLOR, TIER_LABEL, TIER_RANGE, editsLabel } from "@/lib/catalog";
import { formatCents } from "@/lib/money";
import { DeliverableCard } from "@/components/deliverable-card";
import { FoundersPackageTile } from "@/components/founders-package-tile";
import { PlanCards } from "@/components/plan-cards";

const STEPS = [
  { n: 1, title: "Record", body: "Describe the problem in a two-minute video, in plain words.", img: "laptop" },
  { n: 2, title: "Frame", body: "Pick one of three AI-drafted problem statements.", img: "pen" },
  { n: 3, title: "Diagnose", body: "Answer up to seven questions. Your first diagnostic is free.", img: "question" },
  { n: 4, title: "Choose", body: "Pick fixed-price deliverables. Start with Tier 1.", img: "briefcase" },
  { n: 5, title: "Build", body: "AI agents build it; a consultant checks quality.", img: "city" },
  { n: 6, title: "Deliver", body: "Delivered securely to your dashboard.", img: "plane" }
];

const TIERS = [1, 2, 3].map((t) => ({
  tier: t,
  desc:
    t === 1
      ? "1-6 page artifacts. One clear answer to one clear question."
      : t === 2
        ? "Reports, playbooks, and working sessions. The most common purchase."
        : "Redesigns, pilots, and working prototypes, plus 1-on-1 consultant calls."
}));

// Prices come from the database, so rebuild this page every 5 minutes: catalog edits in
// the admin panel show up without a redeploy.
export const revalidate = 300;

export default async function HomePage() {
  const [teaserItems, stats] = await Promise.all([
    getDeliverablesBySlugs(TEASER_SLUGS),
    getCatalogStats()
  ]);

  return (
    <div className="min-h-screen bg-paper">
      <section className="bg-forest text-white">
        <div className="mx-auto flex max-w-[1240px] flex-wrap items-center gap-12 px-7 pb-24 pt-16">
          <div className="min-w-0 flex-[1_1_520px]">
            <span className="inline-block rounded-full bg-white/[.12] px-[14px] py-[6px] text-[14px] font-semibold text-white">
              Your first diagnostic is free
            </span>
            <h1 className="mt-6 max-w-[16ch] text-[40px] font-extrabold leading-[1.08] text-white sm:text-[54px]">
              Don&apos;t know where to start? Talk to Inquew.
            </h1>
            <p className="mt-6 max-w-[46ch] text-[19px] text-[#DCE8E0]">
              Record a two-minute video about what&apos;s not working. We&apos;ll diagnose the real business problem and
              recommend fixed-price fixes, built by AI agents and quality-checked by a consultant.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-5">
              <Link
                href="/intake"
                className="rounded-full bg-sky px-7 py-4 text-[17px] font-bold text-forest hover:bg-aqua hover:text-forest"
              >
                Start your free diagnostic
              </Link>
              <Link href="/how-it-works" className="text-[17px] font-semibold text-white underline hover:text-aqua">
                See how it works
              </Link>
            </div>
            <div className="mt-10 flex flex-wrap gap-7">
              <Stat value={String(stats.count)} label="deliverables on the menu" />
              <div className="w-px bg-white/20" />
              <Stat value={formatCents(stats.lowestPriceCents)} label="lowest entry price" />
              <div className="w-px bg-white/20" />
              <Stat value="100%" label="quality-checked by a consultant" />
            </div>
          </div>
          <div className="flex min-w-0 flex-[1_1_340px] justify-center">
            <div className="flex aspect-square w-[340px] max-w-full items-center justify-center rounded-full bg-white">
              <img src="/assets/mascots/flame.png" alt="Inquew mascot" className="w-[78%] h-auto" />
            </div>
          </div>
        </div>
      </section>

      <section id="how" className="bg-sand">
      <div className="mx-auto max-w-[1240px] px-7 py-20">
        <span className="text-[14px] font-semibold uppercase tracking-[0.12em] text-olive">How it works</span>
        <h2 className="mt-2 text-[38px] font-extrabold">From &ldquo;something&apos;s off&rdquo; to a working fix</h2>
        <div className="mt-[38px] grid grid-cols-[repeat(auto-fit,minmax(170px,1fr))] gap-5">
          {STEPS.map((s) => (
            <div key={s.n} className="rounded-[18px] border border-line bg-white p-6 shadow-card">
              <img src={`/assets/mascots/${s.img}.png`} alt="" className="h-[56px] w-auto" />
              <h3 className="mt-4 text-[18px] font-semibold">
                {s.n}. {s.title}
              </h3>
              <p className="mt-2 text-[14.5px] text-muted">{s.body}</p>
            </div>
          ))}
        </div>
      </div>
      </section>

      <section className="px-7 py-20">
        <div className="mx-auto max-w-[1240px]">
          <div className="flex flex-wrap items-end justify-between gap-5">
            <div>
              <h2 className="text-[34px] font-bold">Pick what you need</h2>
              <p className="mt-3 max-w-[58ch] text-muted">
                A few of {stats.count}. Each one is a single, finished artifact with a price on the front of it.
              </p>
            </div>
            <Link
              href="/deliverables"
              className="rounded-xl border border-[#C9D1CC] bg-white px-[22px] py-[14px] text-[15px] font-semibold hover:border-green"
            >
              View all {stats.count} deliverables
            </Link>
          </div>
          <div className="mt-[34px] grid grid-cols-[repeat(auto-fill,minmax(268px,1fr))] gap-5">
            {teaserItems.map((it) => (
              <DeliverableCard key={it.id} item={it} variant="teaser" />
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1240px] px-7 pt-20">
        <FoundersPackageTile />
      </section>

      <section id="plans" className="mx-auto max-w-[1240px] px-7 pt-20">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div className="max-w-[640px]">
            <span className="text-[14px] font-semibold uppercase tracking-[0.12em] text-olive">Diagnostic plans</span>
            <h2 className="mt-2 text-[38px] font-extrabold leading-[1.15]">
              Inquew remembers your business, so every diagnostic gets sharper
            </h2>
          </div>
          <Link href="/pricing" className="font-semibold">
            Compare plans
          </Link>
        </div>
        <PlanCards />
      </section>

      <section className="mx-auto max-w-[1240px] px-7 py-20">
        <h2 className="text-[34px] font-bold">Three tiers, no negotiation</h2>
        <div className="mt-[34px] grid grid-cols-[repeat(auto-fit,minmax(260px,1fr))] gap-5">
          {TIERS.map(({ tier, desc }) => (
            <div key={tier} className="overflow-hidden rounded-[20px] border border-line bg-white shadow-card">
              <div className="h-[6px]" style={{ background: TIER_COLOR[tier] }} />
              <div className="p-[26px]">
                <span
                  className="rounded-full px-[11px] py-1 text-[11.5px] font-bold text-white"
                  style={{ background: TIER_COLOR[tier] }}
                >
                  {TIER_LABEL[tier]}
                </span>
                <div className="mt-4 font-display text-[28px] font-bold">{TIER_RANGE[tier]}</div>
                <p className="mt-[10px] text-[14.5px] text-muted">{desc}</p>
                <div className="mt-[18px] border-t border-dashed border-line3 pt-4 text-[14px]">
                  {editsLabel(tier)}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section id="security" className="bg-forest px-7 py-[70px]">
        <div className="mx-auto max-w-[1240px]">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="flex items-center gap-4">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#2DC6F0" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <rect x="4" y="10" width="16" height="11" rx="2" />
                <path d="M8 10V7a4 4 0 0 1 8 0v3" />
              </svg>
              <h2 className="text-[32px] font-bold text-white">Your data is protected</h2>
            </div>
            <Link href="/privacy" className="font-semibold text-white underline hover:text-aqua">
              See how we protect your data
            </Link>
          </div>
          <div className="mt-8 grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-5">
            <Trust title="Encrypted" body="Encrypted in transit and at rest, with expiring links for every download." />
            <Trust title="Your data stays in your account" body={"No other client can ever see it, and it's never sold or shared with competitors."} />
            <Trust title="Not used to train AI" body="Not by us, and our AI providers' API terms don't allow it either." />
            <Trust title="Quality-checked by a consultant" body="Every AI-built deliverable, before release." />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1240px] px-7 py-20">
        <div className="rounded-[26px] bg-green px-11 py-14 text-center">
          <h2 className="mx-auto max-w-[24ch] text-[36px] font-bold text-white">
            Describe your problem in two minutes. We&apos;ll take it from there.
          </h2>
          <p className="mt-4 text-[17px] text-[#DCEFE7]">No account required to start. No obligation to buy.</p>
          <Link
            href="/intake"
            className="mt-7 inline-block rounded-[13px] bg-cyan px-[30px] py-[17px] text-[16.5px] font-semibold text-cyan-ink hover:bg-cyan-hover"
          >
            Start your free diagnostic
          </Link>
        </div>
      </section>
    </div>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <div className="font-display text-2xl font-bold text-white">{value}</div>
      <div className="text-[13px] text-[#C4D6CA]">{label}</div>
    </div>
  );
}

function Trust({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-2xl bg-white/[.08] p-6">
      <h3 className="text-[17px] font-semibold text-white">{title}</h3>
      <p className="mt-2 text-[14.5px] text-[#C4D6CA]">{body}</p>
    </div>
  );
}
