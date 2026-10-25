import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getStripe, isStripeConfigured } from "@/lib/stripe";
import { getPlanUsage, syncCheckoutSession, syncSubscription } from "@/lib/subscriptions";
import { PLANS, EXTRA_DIAGNOSTIC_CENTS, usageLine, type PlanId } from "@/lib/plans";
import { formatCents } from "@/lib/money";
import { PlanFeatureList } from "@/components/plan-cards";
import { ChoosePlanButton, ManageBillingButton, BuyExtrasForm } from "@/components/plan/billing-actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Plan & billing — Inquew" };

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

export default async function BillingPage({
  searchParams
}: {
  searchParams: Promise<{ session_id?: string; cancelled?: string; plan?: string }>
}) {
  const session = await auth();
  const userId = session!.user.id;
  const sp = await searchParams;
  const stripeReady = isStripeConfigured();
  let notice: string | null = null;

  // Apply the result straight away when Stripe sends the client back, so the page is right
  // even if the webhook hasn't arrived yet. Then refresh the subscription (plan changes and
  // cancellations made in the Stripe portal) from Stripe itself.
  if (stripeReady) {
    if (sp.session_id) {
      try {
        const checkout = await getStripe().checkout.sessions.retrieve(sp.session_id);
        if (checkout.client_reference_id === userId && checkout.status === "complete") {
          await syncCheckoutSession(checkout);
          notice =
            checkout.mode === "subscription"
              ? "You're subscribed. Thank you!"
              : checkout.payment_status === "paid"
                ? "Your extra diagnostics have been added."
                : "Your payment is processing. Your extra diagnostics will appear once it clears.";
        }
      } catch (err) {
        console.error("billing: could not read checkout session", err);
      }
    }
    const current = await prisma.user.findUnique({ where: { id: userId }, select: { stripeSubscriptionId: true } });
    if (current?.stripeSubscriptionId) {
      await syncSubscription(current.stripeSubscriptionId).catch((err) => console.error("billing: subscription sync failed", err));
    }
  }

  const [usage, user] = await Promise.all([
    getPlanUsage(userId),
    prisma.user.findUnique({ where: { id: userId }, select: { stripeCustomerId: true } })
  ]);
  if (!usage) return null;
  const plan = PLANS[usage.plan];
  const wanted = sp.plan === "PRO" || sp.plan === "PREMIUM" ? (sp.plan as PlanId) : null;
  const left = Math.max(0, usage.allowance - usage.used);
  const pct = usage.allowance ? Math.min(100, Math.round((usage.used / usage.allowance) * 100)) : 0;

  let statusLine = "Free forever. Upgrade any time.";
  if (usage.plan !== "FREE" && usage.periodEnd) {
    statusLine = usage.cancelAtPeriodEnd
      ? `Cancelled. You keep ${plan.name} until ${formatDate(usage.periodEnd)}, then move to Free.`
      : `Renews on ${formatDate(usage.periodEnd)} for ${formatCents(plan.priceCents)}.`;
  }

  return (
    <div className="grid max-w-[920px] gap-6">
      <h1 className="text-[32px] font-bold">Plan &amp; billing</h1>

      {notice && (
        <div role="status" className="rounded-2xl border border-green-border bg-[#EAF3EE] p-4 text-[15px] font-semibold text-forest">
          {notice}
        </div>
      )}
      {sp.cancelled && (
        <div role="status" className="rounded-2xl border border-line bg-white p-4 text-[15px] text-muted">
          Checkout was cancelled. You haven&apos;t been charged.
        </div>
      )}
      {usage.status === "past_due" && (
        <div role="alert" className="rounded-2xl border border-[#E8C3C3] bg-[#FDF2F2] p-4 text-[15px] font-semibold text-[#9B2C2C]">
          Your last payment didn&apos;t go through. Update your card under Manage billing to keep your plan.
        </div>
      )}
      {!stripeReady && (
        <div role="status" className="rounded-2xl border border-line bg-white p-4 text-[15px] text-muted">
          Payments aren&apos;t set up yet, so plans can&apos;t be bought right now.
        </div>
      )}

      <section className="grid gap-5 rounded-[20px] border border-line bg-white p-7">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="text-[13px] font-bold uppercase tracking-[0.08em] text-muted">Your plan</div>
            <h2 className="mt-1 text-[26px] font-extrabold">
              {plan.name}
              {plan.priceCents > 0 && <span className="ml-2 text-[17px] font-semibold text-faint">{formatCents(plan.priceCents)}/month</span>}
            </h2>
            <p className="mt-1 text-muted">{statusLine}</p>
          </div>
          {user?.stripeCustomerId && stripeReady && <ManageBillingButton />}
        </div>

        <div className="grid gap-2">
          <div className="flex flex-wrap justify-between gap-2 text-[15px]">
            <span className="font-semibold">Diagnostics</span>
            <span className="text-muted">{usageLine(usage)}</span>
          </div>
          {!usage.unlimited && (
            <div className="h-3 overflow-hidden rounded-full bg-line" role="progressbar" aria-valuemin={0} aria-valuemax={usage.allowance} aria-valuenow={usage.used} aria-label="Diagnostics used">
              <div className="h-full rounded-full bg-green" style={{ width: `${pct}%` }} />
            </div>
          )}
          <p className="text-[14px] text-muted">
            {usage.plan === "FREE"
              ? `${usage.used} of ${usage.allowance} free diagnostic used.`
              : `${usage.used} of ${usage.allowance} used this billing month.`}
            {usage.extraCredits > 0 && ` You also have ${usage.extraCredits} extra diagnostic${usage.extraCredits === 1 ? "" : "s"}, used once your allowance runs out.`}
            {left === 0 && usage.extraCredits === 0 && !usage.unlimited && " You have none left."}
          </p>
        </div>
        <PlanFeatureList id={usage.plan} />
      </section>

      {usage.plan === "FREE" && (
        <section className="grid gap-4">
          <h2 className="text-[24px] font-extrabold">Choose a plan</h2>
          <div className="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-5">
            {(["PRO", "PREMIUM"] as const).map((id) => (
              <div
                key={id}
                className={`flex flex-col gap-4 rounded-[20px] bg-white p-7 ${wanted === id ? "border-2 border-forest" : "border border-line"}`}
              >
                <h3 className="text-[20px] font-bold">{PLANS[id].name}</h3>
                <div className="font-display text-[36px] font-extrabold text-forest">
                  {formatCents(PLANS[id].priceCents)}
                  <span className="text-[17px] font-semibold text-faint">/month</span>
                </div>
                <PlanFeatureList id={id} />
                <div className="mt-auto">
                  <ChoosePlanButton plan={id} label={`Choose ${id === "PRO" ? "Pro" : "Premium"}`} primary={wanted ? wanted === id : id === "PREMIUM"} disabled={!stripeReady} />
                </div>
              </div>
            ))}
          </div>
          <p className="text-[14px] text-muted">
            Plans renew monthly until you cancel. Cancel any time from this page and you keep your plan until the end of the month you&apos;ve paid for.
          </p>
        </section>
      )}

      {usage.plan === "PRO" && (
        <section className="flex flex-wrap items-center gap-6 rounded-[20px] border-2 border-forest bg-white p-7">
          <div className="grid min-w-0 flex-[1_1_320px] gap-2">
            <h2 className="text-[22px] font-extrabold">Upgrade to Premium</h2>
            <p className="text-[#36423B]">
              {PLANS.PREMIUM.allowance} diagnostics a month instead of {PLANS.PRO.allowance}, plus extras for {formatCents(EXTRA_DIAGNOSTIC_CENTS)} each,
              for {formatCents(PLANS.PREMIUM.priceCents)}/month. Stripe shows the prorated amount before you confirm.
            </p>
          </div>
          <ChoosePlanButton plan="PREMIUM" label="Upgrade to Premium" disabled={!stripeReady} />
        </section>
      )}

      {usage.plan === "PREMIUM" && (
        <section id="extras" className="grid gap-4 rounded-[20px] border border-line bg-white p-7">
          <div>
            <h2 className="text-[22px] font-extrabold">Extra diagnostics</h2>
            <p className="mt-1 text-[#36423B]">
              {formatCents(EXTRA_DIAGNOSTIC_CENTS)} each. They never expire and are only used once your monthly allowance runs out.
            </p>
          </div>
          <BuyExtrasForm disabled={!stripeReady} />
        </section>
      )}

      <p className="text-[14px] text-muted">
        Stakeholder interviews and the Premium quarterly report are coming soon and will be included in your plan when they launch.
        Questions about billing? <Link href="/dashboard/messages">Message us</Link>.
      </p>
    </div>
  );
}
