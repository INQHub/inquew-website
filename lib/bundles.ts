// Bundle pricing shared by the cart, checkout summary and the server-side order total,
// so the discount a client sees is exactly what Stripe charges.

export const FOUNDERS_PACKAGE = {
  name: "Founders Package",
  slugs: ["customer-discovery", "gtm-strategy", "funding-roadmap"],
  discountPct: 10
} as const;

type PricedItem = { slug: string; priceCents: number };

/**
 * 10% off the base prices of the three Founders Package deliverables, but only when all
 * three are in the same order. Add-ons (video, Zoom) are never discounted.
 */
export function foundersDiscountCents(items: PricedItem[]): number {
  const bySlug = new Map(items.map((i) => [i.slug, i.priceCents]));
  if (!FOUNDERS_PACKAGE.slugs.every((s) => bySlug.has(s))) return 0;
  const base = FOUNDERS_PACKAGE.slugs.reduce((sum, s) => sum + (bySlug.get(s) ?? 0), 0);
  return Math.round((base * FOUNDERS_PACKAGE.discountPct) / 100);
}
