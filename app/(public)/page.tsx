import Link from "next/link";
import { getDeliverablesBySlugs, getCatalogStats } from "@/lib/queries/deliverables";
import { HERO_SLUGS, TEASER_SLUGS } from "@/prisma/catalog-data";
import { TIER_COLOR, TIER_LABEL, TIER_RANGE, editsLabel } from "@/lib/catalog";
import { formatCents } from "@/lib/money";
import { DeliverableCard } from "@/components/deliverable-card";
import { HeroMenuItem } from "@/components/hero-menu-item";
import { FoundersPackageTile } from "@/components/founders-package-tile";

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

export default async function HomePage() {
  const [heroItems, teaserItems, stats] = await Promise.all([
    getDeliverablesBySlugs(HERO_SLUGS),
    getDeliverablesBySlugs(TEASER_SLUGS),
    getCatalogStats()
  ]);

  return (
    <div className="min-h-screen bg-paper">
      <section className="mx-auto grid max-w-[1240px] grid-cols-[repeat(auto-fit,minmax(380px,1fr))] items-center gap-14 px-7 pb-10 pt-[72px]">
        <div>
          <span className="inline-block rounded-full border border-green-border bg-green-tint px-[13px] py-[6px] text-[12.5px] font-semibold uppercase tracking-[0.06em] text-green">
            Your first diagnostic is free
          </span>
          <h1 className="mt-[22px] max-w-[16ch] text-[52px] font-extrabold">
            Don&apos;t know where to start? Talk to Inquew.
          </h1>
          <p className="mt-[22px] max-w-[46ch] text-[18px] text-muted">
            Record a two-minute video about what&apos;s not working. We&apos;ll diagnose the real business problem and
            recommend fixed-price fixes from $60 to $1,650, built by AI agents and quality-checked by a consultant.
          </p>
          <div className="mt-8 flex flex-wrap gap-[14px]">
            <Link
              href="/intake"
              className="rounded-[13px] bg-cyan px-[26px] py-4 text-[16px] font-semibold text-cyan-ink shadow-[0_4px_18px_rgba(19,226,233,.35)] hover:bg-cyan-hover"
            >
              Start your free diagnostic
            </Link>
            <Link
              href="/deliverables"
              className="rounded-[13px] border border-[#C9D1CC] bg-white px-[26px] py-4 text-[16px] font-semibold text-ink hover:border-green"
            >
              Browse deliverables
            </Link>
          </div>
          <div className="mt-[38px] flex flex-wrap gap-7">
            <Stat value={String(stats.count)} label="deliverables on the menu" />
            <div className="w-px bg-line3" />
            <Stat value={formatCents(stats.lowestPriceCents)} label="lowest entry price" />
            <div className="w-px bg-line3" />
            <Stat value="100%" label="quality-checked by a consultant" />
          </div>
        </div>
        <div className="relative rounded-[26px] bg-forest p-[26px] shadow-pop">
          <img
            src="/assets/mascots/flame.png"
            alt=""
            className="absolute -right-4 -top-16 hidden h-[120px] w-auto rounded-full bg-white p-3 shadow-card sm:block"
          />
          <div className="mb-[18px] flex items-center justify-between">
            <span className="text-[13px] font-semibold uppercase tracking-[0.05em] text-[#DCEFE7]">
              On the menu today
            </span>
            <Link href="/deliverables" className="text-[13.5px] font-semibold text-cyan">
              See all
            </Link>
          </div>
          <div className="grid gap-3">
            {heroItems.map((it) => (
              <HeroMenuItem key={it.id} item={it} />
            ))}
          </div>
        </div>
      </section>

      <section className="bg-forest px-7 py-[26px]">
        <div className="mx-auto flex max-w-[1240px] flex-wrap items-center justify-center gap-6 text-center">
          <p className="text-[17px] font-medium text-[#F3F5E8]">
            AI agents build every deliverable, and a consultant checks each one for quality before it reaches you.
          </p>
          <Link href="/how-it-works" className="rounded-[11px] bg-cyan px-5 py-[11px] text-[14.5px] font-semibold text-cyan-ink">
            How that works
          </Link>
        </div>
      </section>

      <section className="mx-auto max-w-[1240px] px-7 py-20">
        <h2 className="text-[34px] font-bold">How it works</h2>
        <p className="mt-3 max-w-[60ch] text-muted">From &ldquo;something&apos;s off&rdquo; to a working fix.</p>
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
      </section>

      <section className="border-y border-line2 bg-sand px-7 py-20">
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
      <div className="font-display text-2xl font-bold text-green">{value}</div>
      <div className="text-[13px] text-faint">{label}</div>
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
