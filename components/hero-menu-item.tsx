import Link from "next/link";
import { TIER_COLOR, TIER_LABEL } from "@/lib/catalog";
import { formatCents } from "@/lib/money";
import type { PublicDeliverable } from "@/lib/types";

export function HeroMenuItem({ item }: { item: PublicDeliverable }) {
  return (
    <Link
      href={`/deliverables/${item.slug}`}
      className="flex items-center gap-[14px] rounded-2xl bg-white p-[14px] transition-transform hover:-translate-y-0.5"
    >
      <div className="placeholder-art h-16 w-16 flex-shrink-0 rounded-[11px]" />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span
            className="rounded-full px-2 py-0.5 text-[10.5px] font-bold tracking-[0.04em] text-white"
            style={{ background: TIER_COLOR[item.tier] }}
          >
            {TIER_LABEL[item.tier]}
          </span>
          <span className="text-[11.5px] text-faint">{item.category}</span>
        </div>
        <div className="mt-1 truncate font-display text-[15.5px] font-semibold">{item.title}</div>
      </div>
      <div className="font-display text-[19px] font-bold text-green">{formatCents(item.priceCents)}</div>
    </Link>
  );
}
