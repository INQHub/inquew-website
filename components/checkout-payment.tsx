"use client";

import { useState } from "react";
import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { useRouter } from "next/navigation";
import { getStripePromise } from "@/lib/stripe-client";
import { useCart } from "@/components/cart-context";

export function CheckoutPayment({ clientSecret, orderId }: { clientSecret: string; orderId: string }) {
  const stripePromise = getStripePromise();
  if (!stripePromise) return null;

  return (
    <Elements stripe={stripePromise} options={{ clientSecret }}>
      <PaymentForm orderId={orderId} />
    </Elements>
  );
}

function PaymentForm({ orderId }: { orderId: string }) {
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();
  const cart = useCart();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!stripe || !elements) return;
    setSubmitting(true);
    setError(null);

    const { error: submitError, paymentIntent } = await stripe.confirmPayment({
      elements,
      redirect: "if_required",
      confirmParams: {
        return_url: `${window.location.origin}/order-confirmation/${orderId}`
      }
    });

    if (submitError) {
      setError(submitError.message ?? "Payment failed — check your details and try again.");
      setSubmitting(false);
      return;
    }

    if (paymentIntent?.status === "succeeded" || paymentIntent?.status === "processing") {
      cart.clear();
      router.push(`/order-confirmation/${orderId}`);
    } else {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={submit} className="grid gap-4 rounded-[20px] border border-line bg-white p-[26px]">
      <h3 className="text-[19px] font-semibold">Payment</h3>
      <PaymentElement />
      {error && <p className="text-[13.5px] text-red-700">{error}</p>}
      <button
        type="submit"
        disabled={!stripe || submitting}
        className="w-full rounded-[13px] bg-cyan py-4 text-[16px] font-semibold text-cyan-ink hover:bg-cyan-hover disabled:opacity-60"
      >
        {submitting ? "Processing…" : "Place order"}
      </button>
      <p className="text-[12.5px] text-faint">A consultant is assigned as soon as payment clears. You&apos;ll see the status in your dashboard.</p>
    </form>
  );
}
