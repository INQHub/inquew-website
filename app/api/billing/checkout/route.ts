import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { getStripe, isStripeConfigured } from "@/lib/stripe";
import { logEvent } from "@/lib/events";
import { PLANS, isPaidPlan } from "@/lib/plans";
import { getOrCreateCustomer, getPlanPrice, getPlanUsage, getPortalConfigurationId, stripeFailure } from "@/lib/subscriptions";

const schema = z.object({ plan: z.enum(["PRO", "PREMIUM"]) });

/**
 * Starts a Pro or Premium subscription with Stripe Checkout and returns its URL. A client
 * who already has a live subscription is sent to the Customer Portal to confirm the switch
 * instead, so they never end up paying for two plans.
 */
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  if (!isStripeConfigured()) return NextResponse.json({ error: "Payments aren't set up yet." }, { status: 503 });

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Choose a plan" }, { status: 400 });
  const target = parsed.data.plan;

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  const usage = await getPlanUsage(session.user.id);
  if (!user || !usage) return NextResponse.json({ error: "Account not found" }, { status: 404 });

  try {
    const stripe = getStripe();
    const origin = req.nextUrl.origin;
    const price = await getPlanPrice(target);

    if (isPaidPlan(usage.plan) && user.stripeSubscriptionId) {
      if (usage.plan === target) {
        return NextResponse.json({ error: `You're already on ${PLANS[target].name}.` }, { status: 409 });
      }
      const sub = await stripe.subscriptions.retrieve(user.stripeSubscriptionId);
      const portal = await stripe.billingPortal.sessions.create({
        customer: user.stripeCustomerId!,
        configuration: await getPortalConfigurationId(),
        return_url: `${origin}/dashboard/billing`,
        flow_data: {
          type: "subscription_update_confirm",
          subscription_update_confirm: {
            subscription: sub.id,
            items: [{ id: sub.items.data[0].id, price: price.id, quantity: 1 }]
          },
          after_completion: { type: "redirect", redirect: { return_url: `${origin}/dashboard/billing?changed=1` } }
        }
      });
      return NextResponse.json({ url: portal.url });
    }

    const customer = await getOrCreateCustomer(user);
    const checkout = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer,
      client_reference_id: user.id,
      line_items: [{ price: price.id, quantity: 1 }],
      subscription_data: { metadata: { userId: user.id, plan: target } },
      metadata: { kind: "plan", userId: user.id, plan: target },
      success_url: `${origin}/dashboard/billing?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/dashboard/billing?cancelled=1`
    });

    await logEvent({ type: "plan_checkout_started", userId: user.id, metadata: { plan: target }, actorRole: user.role });
    return NextResponse.json({ url: checkout.url });
  } catch (err) {
    return NextResponse.json(stripeFailure(err), { status: 502 });
  }
}
