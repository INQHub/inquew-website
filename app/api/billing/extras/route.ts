import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { getStripe, isStripeConfigured } from "@/lib/stripe";
import { logEvent } from "@/lib/events";
import { EXTRA_DIAGNOSTIC_CENTS, MAX_EXTRA_PER_PURCHASE } from "@/lib/plans";
import { getOrCreateCustomer, getPlanUsage, stripeFailure } from "@/lib/subscriptions";

const schema = z.object({ quantity: z.number().int().min(1).max(MAX_EXTRA_PER_PURCHASE) });

/** One-off Stripe Checkout for extra diagnostics at $10 each. Premium only. */
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  if (!isStripeConfigured()) return NextResponse.json({ error: "Payments aren't set up yet." }, { status: 503 });

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: `Choose between 1 and ${MAX_EXTRA_PER_PURCHASE} diagnostics` }, { status: 400 });
  }
  const { quantity } = parsed.data;

  const usage = await getPlanUsage(session.user.id);
  if (usage?.plan !== "PREMIUM") {
    return NextResponse.json({ error: "Extra diagnostics are part of the Premium plan." }, { status: 403 });
  }
  try {
    const user = await prisma.user.findUniqueOrThrow({ where: { id: session.user.id } });
    const customer = await getOrCreateCustomer(user);
    const metadata = { kind: "extra_diagnostics", userId: user.id, quantity: String(quantity) };

    const checkout = await getStripe().checkout.sessions.create({
      mode: "payment",
      customer,
      client_reference_id: user.id,
      line_items: [
        {
          quantity,
          price_data: {
            currency: "usd",
            unit_amount: EXTRA_DIAGNOSTIC_CENTS,
            product_data: { name: "Extra Inquew diagnostic", description: "Never expires. Used after your monthly allowance." }
          }
        }
      ],
      metadata,
      payment_intent_data: { metadata },
      success_url: `${req.nextUrl.origin}/dashboard/billing?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.nextUrl.origin}/dashboard/billing?cancelled=1`
    });

    await logEvent({ type: "extras_checkout_started", userId: user.id, metadata: { quantity }, actorRole: user.role });
    return NextResponse.json({ url: checkout.url });
  } catch (err) {
    return NextResponse.json(stripeFailure(err), { status: 502 });
  }
}
