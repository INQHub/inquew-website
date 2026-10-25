import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { getStripe, isStripeConfigured } from "@/lib/stripe";
import { getPortalConfigurationId, stripeFailure } from "@/lib/subscriptions";

/** Opens the Stripe Customer Portal: change plan, cancel, update card, see invoices. */
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  if (!isStripeConfigured()) return NextResponse.json({ error: "Payments aren't set up yet." }, { status: 503 });

  const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { stripeCustomerId: true } });
  if (!user?.stripeCustomerId) {
    return NextResponse.json({ error: "There's no billing account yet. Choose a plan first." }, { status: 409 });
  }

  try {
    const portal = await getStripe().billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      configuration: await getPortalConfigurationId(),
      return_url: `${req.nextUrl.origin}/dashboard/billing`
    });
    return NextResponse.json({ url: portal.url });
  } catch (err) {
    return NextResponse.json(stripeFailure(err), { status: 502 });
  }
}
