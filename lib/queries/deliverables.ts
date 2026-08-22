import { prisma } from "@/lib/prisma";
import type { PublicDeliverable } from "@/lib/types";
import type { Deliverable } from "@prisma/client";

export function toPublic(d: Deliverable): PublicDeliverable {
  return {
    id: d.id,
    slug: d.slug,
    tier: d.tier,
    title: d.title,
    priceCents: d.priceCents,
    teaser: d.teaser,
    category: d.category,
    keyword: d.keyword,
    videoAddon: d.videoAddon,
    zoomAddon: d.zoomAddon,
    description: d.description
  };
}

export async function getDeliverablesBySlugs(slugs: string[]): Promise<PublicDeliverable[]> {
  const rows = await prisma.deliverable.findMany({ where: { slug: { in: slugs }, active: true } });
  const bySlug = new Map(rows.map((r) => [r.slug, r]));
  return slugs.map((s) => bySlug.get(s)).filter((r): r is Deliverable => !!r).map(toPublic);
}

export async function getDeliverableBySlug(slug: string): Promise<PublicDeliverable | null> {
  const row = await prisma.deliverable.findUnique({ where: { slug } });
  return row && row.active ? toPublic(row) : null;
}

export type ShopFilter = {
  tier?: string; // "All" | "Tier 1" | "Tier 2" | "Tier 3"
  category?: string; // "All" | category name
  query?: string;
  sort?: "featured" | "low" | "high" | "az";
};

export async function listDeliverables(filter: ShopFilter): Promise<PublicDeliverable[]> {
  const tierNum = filter.tier && filter.tier !== "All" ? Number(filter.tier.replace("Tier ", "")) : undefined;
  const rows = await prisma.deliverable.findMany({
    where: {
      active: true,
      ...(tierNum ? { tier: tierNum } : {}),
      ...(filter.category && filter.category !== "All" ? { category: filter.category } : {}),
      ...(filter.query
        ? {
            OR: [
              { title: { contains: filter.query, mode: "insensitive" } },
              { teaser: { contains: filter.query, mode: "insensitive" } },
              { category: { contains: filter.query, mode: "insensitive" } }
            ]
          }
        : {})
    },
    orderBy: { sortOrder: "asc" }
  });

  let list = rows.map(toPublic);
  if (filter.sort === "low") list = [...list].sort((a, b) => a.priceCents - b.priceCents);
  if (filter.sort === "high") list = [...list].sort((a, b) => b.priceCents - a.priceCents);
  if (filter.sort === "az") list = [...list].sort((a, b) => a.title.localeCompare(b.title));
  return list;
}

export async function getCatalogStats() {
  const [count, agg] = await Promise.all([
    prisma.deliverable.count({ where: { active: true } }),
    prisma.deliverable.aggregate({ where: { active: true }, _min: { priceCents: true } })
  ]);
  return { count, lowestPriceCents: agg._min.priceCents ?? 0 };
}
