"use client";

import { useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useCart } from "@/components/cart-context";
import { useCatalog } from "@/components/use-catalog";
import { useTrackEvent } from "@/components/use-track-event";
import { formatCents } from "@/lib/money";
import { ADDON_PRICE_CENTS } from "@/lib/catalog";
import { CheckoutPayment } from "@/components/checkout-payment";

export default function CheckoutPage() {
  const { data: session } = useSession();
  const cart = useCart();
  const { byId, loading } = useCatalog();
  const track = useTrackEvent();

  const [contactName, setContactName] = useState(session?.user?.name ?? "");
  const [contactEmail, setContactEmail] = useState(session?.user?.email ?? "");
  const [businessName, setBusinessName] = useState("");
  const [deliveryEmail, setDeliveryEmail] = useState(session?.user?.email ?? "");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [intent, setIntent] = useState<{ orderId: string; clientSecret: string | null; stripeConfigured: boolean } | null>(
    null
  );

  const resolved = cart.lines.map((l) => ({ line: l, item: byId.get(l.deliverableId) })).filter((r) => r.item);
  const itemsTotal = resolved.reduce((a, r) => a + (r.item?.priceCents ?? 0), 0);
  const addonTotal = resolved.reduce(
    (a, r) => a + (r.line.video ? ADDON_PRICE_CENTS.video : 0) + (r.line.zoom ? ADDON_PRICE_CENTS.zoom : 0),
    0
  );

  async function continueToPayment(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    track("checkout_started");
    try {
      const res = await fetch("/api/checkout/create-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lines: cart.lines,
          deliveryMethod: cart.deliveryMethod,
          deliveryEmail: cart.deliveryMethod === "EMAIL" ? deliveryEmail : undefined,
          contactName,
          contactEmail,
          businessName
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not start checkout");
      setIntent(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  if (!loading && resolved.length === 0 && !intent) {
    return (
      <section className="mx-auto max-w-[1040px] px-7 py-20 text-center">
        <h1 className="text-[32px] font-bold">Your cart is empty</h1>
        <Link href="/deliverables" className="mt-6 inline-block rounded-xl bg-cyan px-6 py-[15px] font-semibold text-cyan-ink">
          Browse deliverables
        </Link>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-[1040px] px-7 pb-20 pt-[60px]">
      <Link href="/cart" className="text-[14px] font-semibold text-muted">
        Back to cart
      </Link>
      <h1 className="mt-3 text-[42px] font-bold">Checkout</h1>

      <div className="mt-8 grid grid-cols-[repeat(auto-fit,minmax(320px,1fr))] items-start gap-6">
        <div className="grid gap-[18px]">
          {!intent && (
            <form onSubmit={continueToPayment} className="grid gap-[18px]">
              <div className="grid gap-4 rounded-[20px] border border-line bg-white p-[26px]">
                <h3 className="text-[19px] font-semibold">Contact</h3>
                <Field label="Full name">
                  <input
                    required
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    placeholder="Jane Okafor"
                    className="w-full rounded-[11px] border border-line3 px-[14px] py-[13px] outline-none focus:border-green"
                  />
                </Field>
                <Field label="Email">
                  <input
                    required
                    type="email"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    placeholder="jane@company.com"
                    className="w-full rounded-[11px] border border-line3 px-[14px] py-[13px] outline-none focus:border-green"
                  />
                </Field>
                <Field label="Business name">
                  <input
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    placeholder="Okafor Fabrication LLC"
                    className="w-full rounded-[11px] border border-line3 px-[14px] py-[13px] outline-none focus:border-green"
                  />
                </Field>
              </div>

              <div className="rounded-[20px] border border-line bg-white p-[26px]">
                <h3 className="text-[19px] font-semibold">Delivery method</h3>
                <div className="mt-[14px] grid gap-[10px]">
                  <DeliveryOption
                    active={cart.deliveryMethod === "DASHBOARD"}
                    onClick={() => cart.setDeliveryMethod("DASHBOARD")}
                    title="Platform dashboard"
                    tag="Recommended"
                    body="Deliverable is posted to your secure account. Email notifies you only — no attachment."
                  />
                  <DeliveryOption
                    active={cart.deliveryMethod === "EMAIL"}
                    onClick={() => cart.setDeliveryMethod("EMAIL")}
                    title="Direct email"
                    body="Sent via a secure, expiring link — never a raw attachment."
                  />
                </div>
                {cart.deliveryMethod === "EMAIL" && (
                  <div className="mt-4">
                    <Field label="Delivery email address">
                      <input
                        required
                        type="email"
                        value={deliveryEmail}
                        onChange={(e) => setDeliveryEmail(e.target.value)}
                        placeholder="delivery@company.com"
                        className="w-full rounded-[11px] border border-line3 px-[14px] py-[13px] outline-none focus:border-green"
                      />
                    </Field>
                  </div>
                )}
              </div>

              {error && <p className="text-[13.5px] text-red-700">{error}</p>}
              <button
                type="submit"
                disabled={submitting}
                className="rounded-[13px] bg-cyan py-4 text-[16px] font-semibold text-cyan-ink hover:bg-cyan-hover disabled:opacity-60"
              >
                {submitting ? "Preparing…" : "Continue to payment"}
              </button>
            </form>
          )}

          {intent?.stripeConfigured && intent.clientSecret && (
            <CheckoutPayment clientSecret={intent.clientSecret} orderId={intent.orderId} />
          )}

          {intent && !intent.stripeConfigured && (
            <div className="rounded-[20px] border border-olive-border bg-olive-tint p-[26px]">
              <h3 className="text-[18px] font-semibold text-olive">Payment isn&apos;t live yet</h3>
              <p className="mt-2 text-[14.5px] text-[#6B6238]">
                Order <strong>{intent.orderId}</strong> was created, but Stripe isn&apos;t configured on this
                deployment yet — no charge was made. Add <code>STRIPE_SECRET_KEY</code> and
                <code> NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY</code> to enable real payments.
              </p>
              <Link href={`/order-confirmation/${intent.orderId}`} className="mt-4 inline-block rounded-xl bg-cyan px-5 py-3 font-semibold text-cyan-ink">
                View order status
              </Link>
            </div>
          )}
        </div>

        <div className="sticky top-[100px] rounded-[20px] border border-line bg-white p-[26px]">
          <h3 className="text-[20px] font-semibold">Order summary</h3>
          <div className="mt-4 grid gap-3">
            {resolved.map(({ line, item }) => {
              if (!item) return null;
              const addons = [line.video && "video walkthrough (+$35)", line.zoom && "Zoom consultation (+$45)"]
                .filter(Boolean)
                .join(" and ");
              const lineTotal = item.priceCents + (line.video ? ADDON_PRICE_CENTS.video : 0) + (line.zoom ? ADDON_PRICE_CENTS.zoom : 0);
              return (
                <div key={item.id} className="flex justify-between gap-3 text-[14.5px]">
                  <span className="flex-1">
                    {item.title}
                    <span className="block text-[12.5px] text-faint">{addons || `Tier ${item.tier}`}</span>
                  </span>
                  <span className="font-semibold">{formatCents(lineTotal)}</span>
                </div>
              );
            })}
          </div>
          <div className="mt-[18px] flex items-baseline justify-between border-t border-[#EFEDE2] pt-4">
            <span className="text-[15px] font-semibold">Total due</span>
            <span className="font-display text-[28px] font-bold text-green">{formatCents(itemsTotal + addonTotal)}</span>
          </div>
        </div>
      </div>
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-[6px] text-[13px] font-semibold text-muted">{label}</div>
      {children}
    </div>
  );
}

function DeliveryOption({
  active,
  onClick,
  title,
  tag,
  body
}: {
  active: boolean;
  onClick: () => void;
  title: string;
  tag?: string;
  body: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-[13px] border-2 p-4 text-left"
      style={{ borderColor: active ? "#2D7B5F" : "#E4E0D2", background: active ? "#EFF6F2" : "#FFFFFF" }}
    >
      <div className="text-[15px] font-semibold">
        {title} {tag && <span className="text-[12px] font-semibold text-green">{tag}</span>}
      </div>
      <div className="mt-1 text-[13.5px] text-muted">{body}</div>
    </button>
  );
}
