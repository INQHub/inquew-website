"use client";

import Link from "next/link";
import { TierBadge } from "@/components/tier-badge";
import { PlaceholderArt } from "@/components/placeholder-art";
import { useCart } from "@/components/cart-context";
import { useToast } from "@/components/toast-context";
import { useTrackEvent } from "@/components/use-track-event";
import { formatCents } from "@/lib/money";
import type { PublicDeliverable } from "@/lib/types";

export function DeliverableCard({ item, variant = "shop" }: { item: PublicDeliverable; variant?: "shop" | "teaser" }) {
  const cart = useCart();
  const flash = useToast();
  const track = useTrackEvent();

  const onAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const added = cart.add(item.id);
    if (added) track("add_to_cart", { deliverableId: item.id, slug: item.slug });
    flash(added ? `${item.title} added to cart` : `${item.title} is already in your cart`, {
      href: "/cart",
      linkLabel: "View cart"
    });
  };

  return (
    <div className="flex h-full flex-col rounded-[18px] border border-line bg-white p-4 shadow-card transition-shadow hover:shadow-cardHover hover:border-green-border">
      <Link href={`/deliverables/${item.slug}`} className="block">
        <PlaceholderArt keyword={item.keyword} className="h-[136px]" />
        <div className="mt-[14px] flex flex-wrap items-center gap-2">
          <TierBadge tier={item.tier} />
          <span className="text-[11.5px] text-faint">{item.category}</span>
        </div>
        <h3 className="mt-[10px] text-[17px] font-semibold">{item.title}</h3>
        <p className="mt-[6px] min-h-[44px] text-[14px] text-muted">{item.teaser}</p>
      </Link>

      {variant === "shop" && (
        <div className="mt-[10px] flex min-h-[26px] flex-wrap gap-2">
          {item.videoAddon === "INCLUDED" && (
            <span className="rounded-lg border border-green-border bg-green-tint px-[9px] py-1 text-[11.5px] font-semibold text-green">
              Video walkthrough included
            </span>
          )}
          {item.videoAddon === "ADD" && (
            <span className="rounded-lg border border-line2 bg-sand px-[9px] py-1 text-[11.5px] text-faint">
              + $35 video add-on
            </span>
          )}
          {item.zoomAddon === "ADD" && (
            <span className="rounded-lg border border-line2 bg-sand px-[9px] py-1 text-[11.5px] text-faint">
              + $45 Zoom call
            </span>
          )}
        </div>
      )}

      <div className="mt-auto flex items-center justify-between pt-[14px]">
        <span className="font-display text-[23px] font-bold text-green">{formatCents(item.priceCents)}</span>
        <button
          onClick={onAdd}
          className="rounded-[11px] bg-cyan px-[17px] py-[11px] text-[13.5px] font-semibold text-cyan-ink hover:bg-cyan-hover"
        >
          Add to cart
        </button>
      </div>
    </div>
  );
}
