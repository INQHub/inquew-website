import Link from "next/link";
import { PLANS, PLAN_COPY, type PlanId } from "@/lib/plans";
import { formatCents } from "@/lib/money";

// Diagnostic plans from the V2 brief. Paid plans subscribe through Plan & billing in the
// dashboard (sign-in first if needed).
const CTA: Record<PlanId, { label: string; href: string }> = {
  FREE: { label: "Start free", href: "/intake" },
  PRO: { label: "Choose Pro", href: "/dashboard/billing?plan=PRO" },
  PREMIUM: { label: "Choose Premium", href: "/dashboard/billing?plan=PREMIUM" }
};

export function PlanCards() {
  return (
    <div className="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-6">
      {(["FREE", "PRO", "PREMIUM"] as const).map((id) => {
        const plan = PLANS[id];
        const featured = id === "PREMIUM";
        return (
          <div
            key={id}
            className={`flex flex-col gap-4 rounded-[20px] bg-white p-8 ${featured ? "border-2 border-forest" : "border border-line"}`}
          >
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-[20px] font-bold">{plan.name}</h3>
              {featured && (
                <span className="whitespace-nowrap rounded-full bg-olive-tint px-[10px] py-1 text-[13px] font-bold text-olive">Most value</span>
              )}
            </div>
            <div className="font-display text-[42px] font-extrabold text-forest">
              {formatCents(plan.priceCents)}
              {plan.priceCents > 0 && <span className="text-[18px] font-semibold text-faint">/month</span>}
            </div>
            <p className="text-muted">{PLAN_COPY[id].blurb}</p>
            <PlanFeatureList id={id} />
            <Link
              href={CTA[id].href}
              className={`mt-auto rounded-full px-5 py-3 text-center font-semibold ${
                featured
                  ? "bg-green text-white hover:bg-forest hover:text-white"
                  : "border-2 border-green text-green hover:bg-green hover:text-white"
              }`}
            >
              {CTA[id].label}
            </Link>
          </div>
        );
      })}
    </div>
  );
}

export function PlanFeatureList({ id }: { id: PlanId }) {
  return (
    <ul className="grid list-disc gap-2 pl-5 text-[15px] text-[#36423B]">
      {PLAN_COPY[id].features.map((f) => (
        <li key={f.text}>
          {f.text}
          {f.soon && (
            <span className="ml-2 whitespace-nowrap rounded-full bg-line px-2 py-[2px] text-[12px] font-semibold text-muted">Coming soon</span>
          )}
        </li>
      ))}
    </ul>
  );
}
