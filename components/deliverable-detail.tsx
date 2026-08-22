"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PlaceholderArt } from "@/components/placeholder-art";
import { useCart } from "@/components/cart-context";
import { useToast } from "@/components/toast-context";
import { useTrackEvent } from "@/components/use-track-event";
import { formatCents } from "@/lib/money";
import { TIER_COLOR, TIER_LABEL, TIER_EDITS } from "@/lib/catalog";
import type { PublicDeliverable } from "@/lib/types";

export function DeliverableDetail({
  item,
  onClose,
  backHref
}: {
  item: PublicDeliverable;
  onClose?: () => void;
  backHref?: string;
}) {
  const [video, setVideo] = useState(false);
  const [zoom, setZoom] = useState(false);
  const cart = useCart();
  const flash = useToast();
  const track = useTrackEvent();

  useEffect(() => {
    track("deliverable_viewed", { deliverableId: item.id, slug: item.slug });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item.id]);

  const addonTotal = (video ? 35_00 : 0) + (zoom ? 45_00 : 0);

  const addToCart = () => {
    const added = cart.add(item.id, { video, zoom });
    if (added) track("add_to_cart", { deliverableId: item.id, slug: item.slug, video, zoom });
    flash(added ? `${item.title} added to cart` : `${item.title} is already in your cart`, {
      href: "/cart",
      linkLabel: "View cart"
    });
    onClose?.();
  };

  return (
    <div>
      <div className="relative flex aspect-[21/9] items-end p-[18px]">
        <PlaceholderArt className="absolute inset-0" />
        <span
          className="absolute left-[18px] top-[18px] rounded-full px-3 py-[5px] text-[11px] font-bold text-white"
          style={{ background: TIER_COLOR[item.tier] }}
        >
          {TIER_LABEL[item.tier]}
        </span>
        {onClose && (
          <button
            onClick={onClose}
            className="absolute right-[14px] top-[14px] flex h-[34px] w-[34px] items-center justify-center rounded-full bg-[rgba(253,252,249,.92)] text-[19px] leading-none text-muted"
          >
            ×
          </button>
        )}
        <span className="relative z-10 rounded-md bg-[rgba(253,252,249,.9)] px-2 py-1 font-mono text-[10.5px] text-faint">
          {item.keyword}
        </span>
      </div>

      <div className="px-10 pb-10 pt-[34px]">
        <p className="text-[13px] text-faint">{item.category}</p>
        <h2 className="mt-2 max-w-[26ch] text-[30px] font-bold">{item.title}</h2>
        <div className="mb-[26px] mt-[18px] font-display text-[36px] font-bold text-green">
          {formatCents(item.priceCents)}
        </div>
        <p className="text-[16px] text-ink">{item.description}</p>

        <div className="mt-[22px] rounded-[18px] border border-line bg-white p-5">
          <div className="text-[12px] font-bold uppercase tracking-[0.06em] text-faint">Optional add-ons</div>
          <div className="mt-[14px] grid gap-3">
            {item.videoAddon === "INCLUDED" && (
              <div className="text-[14.5px] font-semibold text-green">
                A video presentation walkthrough is already included in the base price.
              </div>
            )}
            {item.videoAddon === "ADD" && (
              <AddonRow
                checked={video}
                onToggle={() => setVideo((v) => !v)}
                label="Add a video presentation walkthrough"
                price="+$35"
              />
            )}
            {item.zoomAddon === "ADD" && (
              <AddonRow
                checked={zoom}
                onToggle={() => setZoom((z) => !z)}
                label="Add a 30-minute Zoom consultation"
                price="+$45"
              />
            )}
            <p className="text-[12.5px] text-faint">Add-ons are billed with the deliverable. Nothing is charged until checkout.</p>
          </div>
        </div>

        <div className="mt-[18px] grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-[14px]">
          <div className="rounded-[14px] border border-line2 bg-sand p-4">
            <div className="text-[12px] font-bold uppercase tracking-[0.05em] text-faint">Included edits</div>
            <div className="mt-[6px] font-display text-[22px] font-bold">
              {TIER_EDITS[item.tier] === 0 ? "None" : TIER_EDITS[item.tier]}
            </div>
          </div>
          <div className="rounded-[14px] border border-line2 bg-sand p-4">
            <div className="text-[12px] font-bold uppercase tracking-[0.05em] text-faint">Delivery</div>
            <div className="mt-[6px] text-[14px]">Dashboard, or secure expiring email link</div>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-[14px]">
          <button
            onClick={addToCart}
            className="rounded-[13px] bg-cyan px-[26px] py-4 text-[16px] font-semibold text-cyan-ink hover:bg-cyan-hover"
          >
            Add to cart · {formatCents(item.priceCents + addonTotal)}
          </button>
          {onClose ? (
            <button onClick={onClose} className="rounded-[13px] border border-[#CFD8B8] bg-white px-[22px] py-4 font-semibold">
              Keep browsing
            </button>
          ) : (
            <Link href={backHref ?? "/deliverables"} className="rounded-[13px] border border-[#CFD8B8] bg-white px-[22px] py-4 font-semibold">
              Back to menu
            </Link>
          )}
          <span className="text-[13px] text-faint">Created by a human consultant, reviewed before release.</span>
        </div>
      </div>
    </div>
  );
}

function AddonRow({
  checked,
  onToggle,
  label,
  price
}: {
  checked: boolean;
  onToggle: () => void;
  label: string;
  price: string;
}) {
  return (
    <label
      onClick={onToggle}
      className="flex cursor-pointer items-center gap-3 rounded-xl border border-line3 px-[14px] py-3"
      style={{ background: checked ? "#EFF6F2" : "#FDFCF9" }}
    >
      <span
        className="h-[22px] w-[22px] flex-shrink-0 rounded-[7px] border-2"
        style={{ borderColor: checked ? "#2D7B5F" : "#CFCBB8", background: checked ? "#2D7B5F" : "#FFFFFF" }}
      />
      <span className="flex-1 text-[14.5px]">{label}</span>
      <span className="font-semibold text-olive">{price}</span>
    </label>
  );
}

