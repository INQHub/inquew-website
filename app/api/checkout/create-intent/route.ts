import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { getStripe, isStripeConfigured } from "@/lib/stripe";
import { generateOrderDisplayId } from "@/lib/order-id";
import { TIER_EDITS, ADDON_PRICE_CENTS } from "@/lib/catalog";

const schema = z.object({
  lines: z.array(z.object({ deliverableId: z.string(), video: z.boolean().optional(), zoom: z.boolean().optional() })).min(1),
  deliveryMethod: z.enum(["DASHBOARD", "EMAIL"]),
  deliveryEmail: z.string().email().optional(),
  contactName: z.string().min(1),
  contactEmail: z.string().email(),
  businessName: z.string().optional()
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid checkout payload", details: parsed.error.flatten() }, { status: 400 });
  }
  const input = parsed.data;

  const deliverables = await prisma.deliverable.findMany({
    where: { id: { in: input.lines.map((l) => l.deliverableId) }, active: true }
  });
  const byId = new Map(deliverables.map((d) => [d.id, d]));
  if (deliverables.length !== new Set(input.lines.map((l) => l.deliverableId)).size) {
    return NextResponse.json({ error: "One or more deliverables are unavailable" }, { status: 400 });
  }

  let subtotalCents = 0;
  const lineData = input.lines.map((l) => {
    const d = byId.get(l.deliverableId)!;
    const videoAddon = d.videoAddon === "ADD" && !!l.video;
    const zoomAddon = d.zoomAddon === "ADD" && !!l.zoom;
    const lineTotal = d.priceCents + (videoAddon ? ADDON_PRICE_CENTS.video : 0) + (zoomAddon ? ADDON_PRICE_CENTS.zoom : 0);
    subtotalCents += lineTotal;
    return {
      deliverableId: d.id,
      priceCentsAtOrder: d.priceCents,
      videoAddon,
      zoomAddon,
      editsIncluded: TIER_EDITS[d.tier] ?? 0
    };
  });

  const order = await prisma.order.create({
    data: {
      displayId: generateOrderDisplayId(),
      userId: session.user.id,
      status: "PENDING_PAYMENT",
      deliveryMethod: input.deliveryMethod,
      deliveryEmail: input.deliveryMethod === "EMAIL" ? input.deliveryEmail : null,
      contactName: input.contactName,
      contactEmail: input.contactEmail,
      businessName: input.businessName,
      subtotalCents,
      lines: { create: lineData }
    }
  });

  if (!isStripeConfigured()) {
    return NextResponse.json({
      orderId: order.id,
      displayId: order.displayId,
      subtotalCents,
      stripeConfigured: false,
      clientSecret: null
    });
  }

  const stripe = getStripe();
  const intent = await stripe.paymentIntents.create({
    amount: subtotalCents,
    currency: "usd",
    automatic_payment_methods: { enabled: true },
    metadata: { orderId: order.id, displayId: order.displayId }
  });

  await prisma.order.update({ where: { id: order.id }, data: { stripePaymentIntentId: intent.id } });

  return NextResponse.json({
    orderId: order.id,
    displayId: order.displayId,
    subtotalCents,
    stripeConfigured: true,
    clientSecret: intent.client_secret
  });
}
