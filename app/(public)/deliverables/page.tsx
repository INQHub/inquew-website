import Link from "next/link";
import { listDeliverables, getCatalogStats } from "@/lib/queries/deliverables";
import { ShopFilters } from "@/components/shop-filters";
import { DeliverableCard } from "@/components/deliverable-card";
import { CardCarousel } from "@/components/card-carousel";
import { FoundersPackageTile } from "@/components/founders-package-tile";
import { TIER_LABEL, TIER_RANGE, editsLabel } from "@/lib/catalog";

const TIER_ROW_NOTE: Record<number, string> = {
  1: "short artifacts",
  2: "reports and sessions",
  3: "redesigns and prototypes"
};

export default async function DeliverablesPage({
  searchParams
}: {
  searchParams: Promise<{ tier?: string; cat?: string; sort?: string; q?: string }>;
}) {
  const sp = await searchParams;
  const [items, stats] = await Promise.all([
    listDeliverables({
      tier: sp.tier,
      category: sp.cat,
      query: sp.q,
      sort: (sp.sort as "featured" | "low" | "high" | "az") ?? "featured"
    }),
    getCatalogStats()
  ]);

  // With no filters or sort applied, show the menu as one scrollable row per tier.
  const browsing = !sp.tier && !sp.cat && !sp.q && (!sp.sort || sp.sort === "featured");

  return (
    <div>
      <section className="bg-forest px-7 pb-[90px] pt-12">
        <div className="mx-auto max-w-[1240px]">
          <h1 className="text-[42px] font-bold text-white">Deliverables menu</h1>
          <p className="mt-3 max-w-[56ch] text-[17px] text-[#DCEFE7]">
            {stats.count} finished artifacts, each priced on the front. Built by AI agents, quality-checked by a
            consultant.
          </p>
        </div>
      </section>

      <ShopFilters resultLabel={`${items.length} of ${stats.count} deliverables`} />

      <section className="mx-auto max-w-[1240px] px-7 pb-20 pt-6">
        {!sp.tier && !sp.cat && !sp.q && (
          <div className="mb-8">
            <FoundersPackageTile />
          </div>
        )}
        {browsing ? (
          <div className="grid min-w-0 gap-12">
            {[1, 2, 3].map((tier) => {
              const row = items.filter((i) => i.tier === tier);
              if (!row.length) return null;
              return (
                <section key={tier} aria-labelledby={`tier-${tier}`} className="min-w-0">
                  <CardCarousel
                    label={`${TIER_LABEL[tier]} deliverables`}
                    header={
                      <div className="flex flex-wrap items-baseline gap-3">
                        <h2 id={`tier-${tier}`} className="text-[26px] font-extrabold">
                          {TIER_LABEL[tier]}
                        </h2>
                        <span className="text-muted">
                          {TIER_RANGE[tier]} · {TIER_ROW_NOTE[tier]} · {editsLabel(tier).toLowerCase()}
                        </span>
                      </div>
                    }
                  >
                    {row.map((item) => (
                      <div key={item.id} className="w-[272px] flex-shrink-0 snap-start">
                        <DeliverableCard item={item} variant="shop" />
                      </div>
                    ))}
                  </CardCarousel>
                </section>
              );
            })}
          </div>
        ) : (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(272px,1fr))] gap-5">
            {items.map((item) => (
              <DeliverableCard key={item.id} item={item} variant="shop" />
            ))}
          </div>
        )}

        {items.length === 0 && (
          <div className="py-[70px] text-center">
            <h3 className="text-[22px] font-semibold">Nothing matches those filters</h3>
            <p className="mt-[10px] text-muted">Try widening the tier or category, or clear everything.</p>
            <Link
              href="/deliverables"
              className="mt-5 inline-block rounded-xl bg-cyan px-[22px] py-[13px] font-semibold text-cyan-ink"
            >
              Clear filters
            </Link>
          </div>
        )}
      </section>
    </div>
  );
}
