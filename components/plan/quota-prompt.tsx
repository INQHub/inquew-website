import Link from "next/link";
import { PLANS, EXTRA_DIAGNOSTIC_CENTS, type PlanUsage } from "@/lib/plans";
import { formatCents } from "@/lib/money";

const btnPrimary =
  "inline-flex min-h-[44px] items-center justify-center rounded-full bg-green px-7 py-[14px] text-[16px] font-semibold text-white hover:bg-forest hover:text-white";
const btnSecondary =
  "inline-flex min-h-[44px] items-center justify-center rounded-full border border-line3 bg-white px-6 py-[13px] text-[15px] font-semibold text-forest hover:border-green";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

/** Shown when a client has no diagnostics left: the next step depends on their plan. */
export function QuotaPrompt({ usage, saved = false }: { usage: PlanUsage; saved?: boolean }) {
  const resets = usage.periodEnd && !usage.cancelAtPeriodEnd ? ` Your allowance resets on ${formatDate(usage.periodEnd)}.` : "";

  const copy =
    usage.plan === "FREE"
      ? {
          title: "You've used your free diagnostic",
          body: `Pro includes ${PLANS.PRO.allowance} diagnostics a month for ${formatCents(PLANS.PRO.priceCents)}, and Premium includes ${PLANS.PREMIUM.allowance} for ${formatCents(PLANS.PREMIUM.priceCents)}. Cancel anytime.`,
          primary: { href: "/dashboard/billing", label: "Choose a plan" },
          secondary: { href: "/pricing", label: "Compare plans" }
        }
      : usage.plan === "PRO"
        ? {
            title: `You've used all ${usage.allowance} diagnostics this month`,
            body: `Premium includes ${PLANS.PREMIUM.allowance} a month, and you can buy extras for ${formatCents(EXTRA_DIAGNOSTIC_CENTS)} each.${resets}`,
            primary: { href: "/dashboard/billing?plan=PREMIUM", label: "Upgrade to Premium" },
            secondary: { href: "/dashboard/billing", label: "Plan & billing" }
          }
        : {
            title: `You've used all ${usage.allowance} diagnostics this month`,
            body: `Buy an extra diagnostic for ${formatCents(EXTRA_DIAGNOSTIC_CENTS)}. Extras never expire.${resets}`,
            primary: { href: "/dashboard/billing#extras", label: "Buy an extra diagnostic" },
            secondary: { href: "/dashboard/billing", label: "Plan & billing" }
          };

  return (
    <div className="flex flex-wrap items-center gap-6 rounded-[22px] border border-line bg-white p-8">
      <img src="/assets/mascots/capsule.png" alt="" className="h-[96px] w-auto" />
      <div className="grid min-w-0 flex-[1_1_320px] gap-3">
        <h1 className="text-[28px] font-extrabold leading-[1.2]">{copy.title}</h1>
        <p className="text-[16px] text-[#36423B]">{copy.body}</p>
        {saved && (
          <p className="text-[15px] text-muted">
            Your answers are saved. Once you have a diagnostic available, finish this one from{" "}
            <Link href="/dashboard/diagnoses">Diagnoses</Link> in your dashboard.
          </p>
        )}
        <div className="mt-2 flex flex-wrap gap-3">
          <Link href={copy.primary.href} className={btnPrimary}>
            {copy.primary.label}
          </Link>
          <Link href={copy.secondary.href} className={btnSecondary}>
            {copy.secondary.label}
          </Link>
        </div>
      </div>
    </div>
  );
}
