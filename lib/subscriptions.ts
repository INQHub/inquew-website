import Stripe from "stripe";
import { Prisma, type Plan } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getStripe } from "@/lib/stripe";
import { PLANS, isPaidPlan, type PlanUsage } from "@/lib/plans";

// Stripe statuses that keep a paid plan's benefits. past_due keeps them while Stripe retries the card.
const LIVE_STATUSES = new Set<Stripe.Subscription.Status>(["active", "trialing", "past_due"]);
// Statuses after which the subscription can never become active again.
const ENDED_STATUSES = new Set<Stripe.Subscription.Status>(["canceled", "incomplete_expired"]);
// If a webhook is missed, don't keep a paid plan forever: fall back to Free a few days past the period end.
const PERIOD_GRACE_MS = 3 * 86_400_000;

/** JSON error for a billing route when a Stripe call fails, so the page can show a plain message. */
export function stripeFailure(err: unknown) {
  console.error("Stripe request failed", err);
  return { error: "We couldn't reach the payment system. Please try again in a minute." };
}

// ───────────────────────── Usage and quota ─────────────────────────

const usageSelect = {
  role: true,
  plan: true,
  planPeriodStart: true,
  planPeriodEnd: true,
  planCancelAtPeriodEnd: true,
  subscriptionStatus: true,
  extraDiagnosticCredits: true
} satisfies Prisma.UserSelect;

type UsageUser = Prisma.UserGetPayload<{ select: typeof usageSelect }>;
type Db = Prisma.TransactionClient | typeof prisma;

function effectivePlan(user: UsageUser, now = Date.now()): Plan {
  if (!isPaidPlan(user.plan)) return "FREE";
  if (user.planPeriodEnd && user.planPeriodEnd.getTime() + PERIOD_GRACE_MS < now) return "FREE";
  return user.plan;
}

/** Diagnoses that count against the plan allowance (ones paid for with an extra credit don't). */
async function countAllowanceUsed(db: Db, userId: string, plan: Plan, periodStart: Date | null) {
  const since = plan === "FREE" ? undefined : (periodStart ?? new Date(Date.now() - 31 * 86_400_000));
  return db.intakeSession.count({
    where: { userId, usedExtraCredit: false, diagnosedAt: since ? { gte: since } : { not: null } }
  });
}

async function buildUsage(db: Db, userId: string, user: UsageUser): Promise<PlanUsage> {
  const plan = effectivePlan(user);
  const def = PLANS[plan];
  const used = await countAllowanceUsed(db, userId, plan, user.planPeriodStart);
  const unlimited = user.role === "ADMIN";
  return {
    plan,
    allowance: def.allowance,
    used,
    extraCredits: user.extraDiagnosticCredits,
    remaining: unlimited ? Infinity : Math.max(0, def.allowance - used) + user.extraDiagnosticCredits,
    periodEnd: plan === "FREE" ? null : (user.planPeriodEnd?.toISOString() ?? null),
    cancelAtPeriodEnd: plan !== "FREE" && user.planCancelAtPeriodEnd,
    status: user.subscriptionStatus,
    unlimited
  };
}

export async function getPlanUsage(userId: string): Promise<PlanUsage | null> {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: usageSelect });
  return user ? buildUsage(prisma, userId, user) : null;
}

export class QuotaExceededError extends Error {
  constructor(public usage: PlanUsage) {
    super("No diagnostics left on your plan");
  }
}

/** JSON body for a 402 response, so the intake page can show the right upgrade prompt. */
export function quotaErrorBody(usage: PlanUsage) {
  const message =
    usage.plan === "FREE"
      ? "You've used your free diagnostic. Choose Pro or Premium to run more."
      : usage.plan === "PRO"
        ? `You've used all ${usage.allowance} diagnostics this month. Upgrade to Premium for more.`
        : `You've used all ${usage.allowance} diagnostics this month. Buy an extra diagnostic to keep going.`;
  return { error: message, code: "quota", usage: { ...usage, remaining: 0 } };
}

/**
 * Marks an intake as diagnosed and charges it to the client's plan in one transaction:
 * the monthly (or free) allowance first, then an extra credit. Throws QuotaExceededError
 * when neither is left, and nothing is written.
 */
export async function saveDiagnosisWithinQuota(
  userId: string,
  intakeId: string,
  data: Omit<Prisma.IntakeSessionUpdateInput, "usedExtraCredit">
) {
  return prisma.$transaction(async (tx) => {
    const user = await tx.user.findUniqueOrThrow({ where: { id: userId }, select: usageSelect });
    const usage = await buildUsage(tx, userId, user);
    let usedExtraCredit = false;
    if (!usage.unlimited && usage.used >= usage.allowance) {
      const taken = await tx.user.updateMany({
        where: { id: userId, extraDiagnosticCredits: { gt: 0 } },
        data: { extraDiagnosticCredits: { decrement: 1 } }
      });
      if (taken.count === 0) throw new QuotaExceededError(usage);
      usedExtraCredit = true;
    }
    await tx.intakeSession.update({ where: { id: intakeId }, data: { ...data, usedExtraCredit } });
    return { usedExtraCredit };
  });
}

// ───────────────────────── Stripe: prices, customers, portal ─────────────────────────

const priceCache = new Map<string, Stripe.Price>();

/** The monthly Price for a paid plan, looked up by lookup key and created on first use. */
export async function getPlanPrice(plan: "PRO" | "PREMIUM"): Promise<Stripe.Price> {
  const def = PLANS[plan];
  const key = def.lookupKey!;
  const cached = priceCache.get(key);
  if (cached) return cached;

  const stripe = getStripe();
  const find = async () => (await stripe.prices.list({ lookup_keys: [key], active: true, limit: 1 })).data[0];
  let price = await find();
  if (!price) {
    try {
      const product = await stripe.products.create({ name: `Inquew ${def.name}`, metadata: { inquew_plan: plan } });
      price = await stripe.prices.create({
        product: product.id,
        currency: "usd",
        unit_amount: def.priceCents,
        recurring: { interval: "month" },
        lookup_key: key,
        metadata: { inquew_plan: plan }
      });
    } catch (err) {
      // Another request created it first (lookup keys are unique).
      price = await find();
      if (!price) throw err;
    }
  }
  priceCache.set(key, price);
  return price;
}

function planFromPrice(price: Stripe.Price | undefined): "PRO" | "PREMIUM" | null {
  if (!price) return null;
  if (price.lookup_key === PLANS.PRO.lookupKey || price.metadata?.inquew_plan === "PRO") return "PRO";
  if (price.lookup_key === PLANS.PREMIUM.lookupKey || price.metadata?.inquew_plan === "PREMIUM") return "PREMIUM";
  return null;
}

/** The client's Stripe customer, created (or recreated, e.g. after switching test → live keys) as needed. */
export async function getOrCreateCustomer(user: { id: string; email: string; name: string | null; stripeCustomerId: string | null }) {
  const stripe = getStripe();
  if (user.stripeCustomerId) {
    try {
      const existing = await stripe.customers.retrieve(user.stripeCustomerId);
      if (!existing.deleted) return existing.id;
    } catch (err) {
      if ((err as { code?: string }).code !== "resource_missing") throw err;
    }
  }
  const customer = await stripe.customers.create({
    email: user.email,
    name: user.name ?? undefined,
    metadata: { userId: user.id }
  });
  await prisma.user.update({ where: { id: user.id }, data: { stripeCustomerId: customer.id } });
  return customer.id;
}

let portalConfigId: string | null = null;

/**
 * A Customer Portal configuration that lets clients switch between Pro and Premium, cancel
 * at period end, update their card and see invoices. Created through the API so there's
 * nothing to set up in the Stripe dashboard; tagged with the price ids so it's rebuilt if
 * the prices ever change.
 */
export async function getPortalConfigurationId(): Promise<string> {
  if (portalConfigId) return portalConfigId;
  const stripe = getStripe();
  const [pro, premium] = await Promise.all([getPlanPrice("PRO"), getPlanPrice("PREMIUM")]);
  const tag = `${pro.id}:${premium.id}`;

  const existing = await stripe.billingPortal.configurations.list({ active: true, limit: 100 });
  const match = existing.data.find((c) => c.metadata?.inquew === tag);
  if (match) return (portalConfigId = match.id);

  const productId = (p: Stripe.Price) => (typeof p.product === "string" ? p.product : p.product.id);
  const created = await stripe.billingPortal.configurations.create({
    business_profile: { headline: "Manage your Inquew plan" },
    features: {
      invoice_history: { enabled: true },
      payment_method_update: { enabled: true },
      subscription_cancel: { enabled: true, mode: "at_period_end" },
      subscription_update: {
        enabled: true,
        default_allowed_updates: ["price"],
        proration_behavior: "create_prorations",
        products: [
          { product: productId(pro), prices: [pro.id] },
          { product: productId(premium), prices: [premium.id] }
        ]
      }
    },
    metadata: { inquew: tag }
  });
  return (portalConfigId = created.id);
}

// ───────────────────────── Stripe → database sync ─────────────────────────

/**
 * Copies a subscription's current state onto the user. Always re-fetches from Stripe so
 * webhooks that arrive out of order can't roll the plan back.
 */
export async function syncSubscription(subscriptionId: string) {
  await applySubscription(await getStripe().subscriptions.retrieve(subscriptionId));
}

export async function applySubscription(sub: Stripe.Subscription) {
  const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer.id;
  const user = await prisma.user.findFirst({
    where: { OR: [{ stripeCustomerId: customerId }, ...(sub.metadata?.userId ? [{ id: sub.metadata.userId }] : [])] }
  });
  if (!user) {
    console.error("Stripe subscription has no matching user", sub.id, customerId);
    return;
  }
  // An old subscription ending must not wipe out the newer one the client moved to.
  if (user.stripeSubscriptionId && user.stripeSubscriptionId !== sub.id && !LIVE_STATUSES.has(sub.status)) return;

  const item = sub.items.data[0];
  const plan = planFromPrice(item?.price);
  const live = LIVE_STATUSES.has(sub.status) && plan !== null;
  const ended = ENDED_STATUSES.has(sub.status);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      plan: live ? plan : "FREE",
      stripeCustomerId: customerId,
      stripeSubscriptionId: ended ? null : sub.id,
      subscriptionStatus: sub.status,
      planPeriodStart: live && item ? new Date(item.current_period_start * 1000) : null,
      planPeriodEnd: live && item ? new Date(item.current_period_end * 1000) : null,
      planCancelAtPeriodEnd: live && (sub.cancel_at_period_end || sub.cancel_at !== null)
    }
  });
}

/** Credits a paid extra-diagnostics checkout. Safe to call more than once for the same session. */
export async function fulfillExtraDiagnostics(session: Stripe.Checkout.Session): Promise<boolean> {
  if (session.mode !== "payment" || session.metadata?.kind !== "extra_diagnostics" || session.payment_status !== "paid") {
    return false;
  }
  const userId = session.metadata.userId;
  const quantity = Number(session.metadata.quantity);
  if (!userId || !Number.isInteger(quantity) || quantity < 1) return false;
  if (await prisma.diagnosticCreditPurchase.findUnique({ where: { stripeCheckoutSessionId: session.id } })) return true;
  try {
    await prisma.$transaction([
      prisma.diagnosticCreditPurchase.create({
        data: { userId, stripeCheckoutSessionId: session.id, quantity, amountCents: session.amount_total ?? 0 }
      }),
      prisma.user.update({ where: { id: userId }, data: { extraDiagnosticCredits: { increment: quantity } } })
    ]);
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") return true; // already credited
    throw err;
  }
  return true;
}

/** Handles a completed Checkout Session (from the webhook or the billing page return). */
export async function syncCheckoutSession(session: Stripe.Checkout.Session) {
  if (session.mode === "subscription" && session.subscription) {
    const subId = typeof session.subscription === "string" ? session.subscription : session.subscription.id;
    await syncSubscription(subId);
  } else if (session.mode === "payment") {
    await fulfillExtraDiagnostics(session);
  }
}
