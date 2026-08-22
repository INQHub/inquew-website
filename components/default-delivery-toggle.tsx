"use client";

import { useCart } from "@/components/cart-context";

export function DefaultDeliveryToggle() {
  const cart = useCart();
  return (
    <div className="flex flex-wrap gap-[10px]">
      <button
        onClick={() => cart.setDeliveryMethod("DASHBOARD")}
        className="rounded-[11px] border-2 px-[18px] py-3 text-[14px] font-semibold"
        style={{ borderColor: cart.deliveryMethod === "DASHBOARD" ? "#2D7B5F" : "#E4E0D2", background: cart.deliveryMethod === "DASHBOARD" ? "#EFF6F2" : "#FFFFFF" }}
      >
        Dashboard
      </button>
      <button
        onClick={() => cart.setDeliveryMethod("EMAIL")}
        className="rounded-[11px] border-2 px-[18px] py-3 text-[14px] font-semibold"
        style={{ borderColor: cart.deliveryMethod === "EMAIL" ? "#2D7B5F" : "#E4E0D2", background: cart.deliveryMethod === "EMAIL" ? "#EFF6F2" : "#FFFFFF" }}
      >
        Secure email link
      </button>
    </div>
  );
}
