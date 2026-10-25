import Link from "next/link";
import { PlanCards } from "@/components/plan-cards";
import { FoundersPackageTile } from "@/components/founders-package-tile";
import { TIER_LABEL, TIER_RANGE, editsLabel } from "@/lib/catalog";

export const metadata = { title: "Pricing — Inquew" };

const TIER_BLURB: Record<number, string> = {
  1: "Short artifacts",
  2: "Reports and sessions",
  3: "Redesigns and prototypes"
};

const COMPARE = [
  ["Diagnostic tests", "1, first visit only", "5", "7"],
  ["Business library memory", "Yes", "Yes", "Yes"],
  ["Extra diagnostics", "Upgrade", "Upgrade to Premium", "$10 each"],
  ["Stakeholder interview sets (coming soon)", "—", "5", "7"],
  ["Quarterly report with recommended deliverables (coming soon)", "—", "—", "Yes"]
];

const FAQ = [
  {
    q: "What counts as one diagnostic?",
    a: "One problem statement taken through the question set, ending in a results page with recommended next steps."
  },
  { q: "Do I need a plan to buy deliverables?", a: "No. A free account can order any deliverable at its listed price." },
  { q: "Is my data used to train AI?", a: "No. Not by us, and our AI providers' API terms don't allow it either." },
  {
    q: "Can I cancel any time?",
    a: "Yes. Cancel from Plan & billing in your dashboard. You keep your plan until the end of the month you've paid for, then move to Free."
  },
  {
    q: "What happens when I run out of diagnostics?",
    a: "Your allowance resets each billing month. Pro members can upgrade to Premium, and Premium members can buy extra diagnostics for $10 each. Extras never expire."
  }
];

export default function PricingPage() {
  return (
    <div>
      <section className="bg-sand">
        <div className="mx-auto grid max-w-[1200px] gap-9 px-6 py-16">
          <div className="flex flex-wrap items-center gap-6">
            <div className="min-w-0 flex-[1_1_560px]">
              <h1 className="text-[48px] font-extrabold leading-[1.1]">Simple prices. Your first diagnostic is free.</h1>
              <p className="mt-3 text-[19px] text-[#36423B]">
                Pay monthly for diagnostics, and buy fixed-price deliverables only when you need them.
              </p>
            </div>
            <img src="/assets/mascots/capsule.png" alt="" className="h-[110px] w-auto" />
          </div>
          <PlanCards />
        </div>
      </section>

      <section className="mx-auto grid max-w-[1200px] gap-6 px-6 py-16">
        <h2 className="text-[32px] font-extrabold">Compare plans</h2>
        <div className="overflow-x-auto rounded-2xl border border-line">
          <table className="w-full min-w-[640px] border-collapse">
            <thead>
              <tr className="bg-sand text-left">
                <th scope="col" className="p-4 font-semibold">Included each month</th>
                <th scope="col" className="p-4 font-semibold">Free</th>
                <th scope="col" className="p-4 font-semibold">Pro</th>
                <th scope="col" className="p-4 font-semibold">Premium</th>
              </tr>
            </thead>
            <tbody>
              {COMPARE.map(([label, ...cells]) => (
                <tr key={label}>
                  <th scope="row" className="border-t border-line p-4 text-left font-medium">
                    {label}
                  </th>
                  {cells.map((c, i) => (
                    <td key={i} className="border-t border-line p-4">
                      {c}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="bg-sand">
        <div className="mx-auto flex max-w-[1200px] flex-wrap items-start gap-8 px-6 py-16">
          <div className="grid min-w-0 flex-[1_1_420px] gap-4">
            <h2 className="text-[32px] font-extrabold">Deliverables, priced up front</h2>
            <p className="text-[#36423B]">
              Built by AI agents and quality-checked by a consultant. You accept the deliverable terms at checkout.
            </p>
            {[1, 2, 3].map((t) => (
              <div key={t} className="flex justify-between gap-3 rounded-2xl bg-white px-5 py-4">
                <span>
                  <strong className="text-forest">{TIER_LABEL[t]}</strong> · {TIER_BLURB[t]} · {editsLabel(t).toLowerCase()}
                </span>
                <strong>{TIER_RANGE[t]}</strong>
              </div>
            ))}
            <Link href="/deliverables" className="font-semibold">
              See all deliverables
            </Link>
          </div>
          <div className="grid min-w-0 flex-[1_1_420px] gap-3">
            <h2 className="text-[32px] font-extrabold">Questions</h2>
            {FAQ.map((f) => (
              <details key={f.q} className="rounded-2xl bg-white px-5 py-4">
                <summary className="cursor-pointer font-semibold text-forest">{f.q}</summary>
                <p className="mt-2 text-[#36423B]">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1200px] px-6 py-16">
        <FoundersPackageTile />
      </section>
    </div>
  );
}
