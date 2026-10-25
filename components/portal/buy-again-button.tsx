"use client";

import { useRouter } from "next/navigation";
import { useCart } from "@/components/cart-context";

/** Puts the deliverables from a past order back in the cart. */
export function BuyAgainButton({ deliverableIds }: { deliverableIds: string[] }) {
  const cart = useCart();
  const router = useRouter();
  return (
    <button
      type="button"
      onClick={() => {
        deliverableIds.forEach((id) => cart.add(id));
        router.push("/cart");
      }}
      className="min-h-[36px] font-semibold text-green underline"
    >
      Buy again
    </button>
  );
}
