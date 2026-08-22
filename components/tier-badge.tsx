import { TIER_COLOR, TIER_LABEL } from "@/lib/catalog";

export function TierBadge({ tier, size = "md" }: { tier: number; size?: "sm" | "md" }) {
  const pad = size === "sm" ? "px-[8px] py-[2px] text-[10.5px]" : "px-[9px] py-[3px] text-[10.5px]";
  return (
    <span
      className={`inline-block rounded-full font-bold tracking-[0.04em] text-white ${pad}`}
      style={{ background: TIER_COLOR[tier] }}
    >
      {TIER_LABEL[tier]}
    </span>
  );
}
