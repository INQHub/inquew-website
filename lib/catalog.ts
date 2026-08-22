export const TIER_COLOR: Record<number, string> = { 1: "#978E4C", 2: "#2D7B5F", 3: "#425206" };
export const TIER_LABEL: Record<number, string> = { 1: "Tier 1", 2: "Tier 2", 3: "Tier 3" };
export const TIER_RANGE: Record<number, string> = { 1: "$60–$150", 2: "$150–$500", 3: "$500–$1,500" };
export const TIER_EDITS: Record<number, number> = { 1: 0, 2: 1, 3: 4 };

export function editsLabel(tier: number): string {
  const n = TIER_EDITS[tier] ?? 0;
  if (n === 0) return "No included edits";
  return `${n} included ${n === 1 ? "edit" : "edits"}`;
}

export const ADDON_PRICE_CENTS = { video: 35_00, zoom: 45_00 };
