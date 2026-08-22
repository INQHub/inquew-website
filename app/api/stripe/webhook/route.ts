import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getStripe, isStripeConfigured } from "@/lib/stripe";
import { logEvent, EVENT } from "@/lib/events";
import { sendEmail } from "@/lib/email";

export async function POST(req: NextRequest) {
  if (!isStripeConfigured() || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Stripe webhook is not configured" }, { status: 503 });
  }

  const signature = req.headers.get("stripe-signature");
  const rawBody = await req.text();

  let event;
  try {
    event = getStripe().webhooks.constructEvent(rawBody, signature ?? "", process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error("Stripe webhook signature verification failed", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "payment_intent.succeeded") {
    const intent = event.data.object as { id: string };
    const order = await prisma.order.findFirst({ where: { stripePaymentIntentId: intent.id } });
    if (order && order.status === "PENDING_PAYMENT") {
      await prisma.order.update({ where: { id: order.id }, data: { status: "PAID" } });
      await logEvent({ type: EVENT.ORDER_PLACED, userId: order.userId, metadata: { orderId: order.id } });
      if (order.contactEmail) {
        await sendEmail({
          to: order.contactEmail,
          subject: `Order ${order.displayId} confirmed`,
          html: `<p>Your order ${order.displayId} is paid and has been sent to a consultant.</p>`
        });
      }
    }
  }

  if (event.type === "payment_intent.payment_failed") {
    const intent = event.data.object as { id: string };
    await prisma.order.updateMany({
      where: { stripePaymentIntentId: intent.id, status: "PENDING_PAYMENT" },
      data: { status: "CANCELLED" }
    });
  }

  return NextResponse.json({ received: true });
}
