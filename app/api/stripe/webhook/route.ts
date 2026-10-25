import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getStripe, isStripeConfigured } from "@/lib/stripe";
import { logEvent, EVENT } from "@/lib/events";
import { sendEmail } from "@/lib/email";
import { notifyAdmins } from "@/lib/notifications";
import { formatCents } from "@/lib/money";
import { syncCheckoutSession, syncSubscription } from "@/lib/subscriptions";

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
    const order = await prisma.order.findFirst({
      where: { stripePaymentIntentId: intent.id },
      include: { user: { select: { role: true } } }
    });
    if (order && order.status === "PENDING_PAYMENT") {
      await prisma.order.update({ where: { id: order.id }, data: { status: "PAID" } });
      await logEvent({
        type: EVENT.ORDER_PLACED,
        userId: order.userId,
        metadata: { orderId: order.id },
        actorRole: order.user.role
      });
      if (order.contactEmail) {
        await sendEmail({
          to: order.contactEmail,
          subject: `Order ${order.displayId} confirmed`,
          html: `<p>Your order ${order.displayId} is paid and has been sent to a consultant.</p>`
        });
      }
      await notifyAdmins({
        type: "NEW_ORDER",
        title: `New order ${order.displayId}`,
        body: `${order.contactName ?? order.contactEmail ?? "A customer"} placed an order for ${formatCents(order.subtotalCents)}.`,
        link: `/admin/orders/${order.id}`
      });
    }
  }

  if (event.type === "payment_intent.payment_failed") {
    const intent = event.data.object as { id: string };
    await prisma.order.updateMany({
      where: { stripePaymentIntentId: intent.id, status: "PENDING_PAYMENT" },
      data: { status: "CANCELLED" }
    });
  }

  // Pro / Premium subscriptions and extra diagnostic purchases. The endpoint in the Stripe
  // dashboard must send these event types too (see SETUP.md).
  try {
    if (event.type === "checkout.session.completed" || event.type === "checkout.session.async_payment_succeeded") {
      await syncCheckoutSession(event.data.object);
    }
    if (
      event.type === "customer.subscription.created" ||
      event.type === "customer.subscription.updated" ||
      event.type === "customer.subscription.deleted"
    ) {
      await syncSubscription(event.data.object.id);
    }
  } catch (err) {
    console.error("Stripe plan sync failed", event.type, err);
    return NextResponse.json({ error: "Sync failed" }, { status: 500 }); // Stripe retries
  }

  return NextResponse.json({ received: true });
}
