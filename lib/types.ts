export type PublicDeliverable = {
  id: string;
  slug: string;
  tier: number;
  title: string;
  priceCents: number;
  teaser: string;
  category: string;
  keyword: string;
  videoAddon: "NONE" | "ADD" | "INCLUDED";
  zoomAddon: "NONE" | "ADD" | "INCLUDED";
  description?: string;
};
