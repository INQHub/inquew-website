// Diagnostic plans. Safe to import from client components: no Prisma or Stripe here.

export type PlanId = "FREE" | "PRO" | "PREMIUM";

export type PlanDef = {
  id: PlanId;
  name: string;
  priceCents: number;
  /** Diagnostics included. FREE's allowance is for the life of the account; paid plans reset each billing month. */
  allowance: number;
  /** Stripe Price lookup key; the price is created on first use if it doesn't exist yet. */
  lookupKey?: string;
};

export const PLANS: Record<PlanId, PlanDef> = {
  FREE: { id: "FREE", name: "Free", priceCents: 0, allowance: 1 },
  PRO: { id: "PRO", name: "Pro Diagnostics", priceCents: 1500, allowance: 5, lookupKey: "inquew_pro_monthly" },
  PREMIUM: { id: "PREMIUM", name: "Premium Diagnostics", priceCents: 2000, allowance: 7, lookupKey: "inquew_premium_monthly" }
};

export type PlanFeature = { text: string; soon?: boolean };

/** Plan card copy, shared by the public plan cards and Plan & billing. `soon` = not built yet. */
export const PLAN_COPY: Record<PlanId, { blurb: string; features: PlanFeature[] }> = {
  FREE: {
    blurb: "For your first look at what's wrong.",
    features: [
      { text: "1 diagnostic on your first visit" },
      { text: "Results saved to a free account" },
      { text: "Recommended next-step deliverables" }
    ]
  },
  PRO: {
    blurb: "For owners working through a few problems at once.",
    features: [
      { text: "5 diagnostic tests a month" },
      { text: "Your business library builds over time" },
      { text: "5 sets of stakeholder interviews a month", soon: true }
    ]
  },
  PREMIUM: {
    blurb: "For teams improving the business every quarter.",
    features: [
      { text: "7 diagnostic tests a month" },
      { text: "Extra diagnostics for $10 each" },
      { text: "Your business library builds over time" },
      { text: "7 sets of stakeholder interviews a month", soon: true },
      { text: "Quarterly report with recommended deliverables", soon: true }
    ]
  }
};

/** Price of one extra diagnostic. Only Premium subscribers can buy them. */
export const EXTRA_DIAGNOSTIC_CENTS = 1000;
export const MAX_EXTRA_PER_PURCHASE = 10;

export function isPaidPlan(plan: PlanId): plan is "PRO" | "PREMIUM" {
  return plan === "PRO" || plan === "PREMIUM";
}

/** What the client sees about their allowance; built server-side by getPlanUsage(). */
export type PlanUsage = {
  plan: PlanId;
  allowance: number;
  used: number;
  extraCredits: number;
  /** Allowance left plus extra credits. Infinity for admins. */
  remaining: number;
  periodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  status: string | null;
  unlimited: boolean;
};

/** Short line for meters, e.g. "3 of 5 left this month". */
export function usageLine(u: PlanUsage): string {
  if (u.unlimited) return "Unlimited (admin)";
  const left = Math.max(0, u.allowance - u.used);
  const base = u.plan === "FREE" ? `${left} of ${u.allowance} free diagnostic left` : `${left} of ${u.allowance} left this month`;
  return u.extraCredits > 0 ? `${base} + ${u.extraCredits} extra` : base;
}
