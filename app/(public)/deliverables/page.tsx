import Link from "next/link";
import { listDeliverables, getCatalogStats } from "@/lib/queries/deliverables";
import { ShopFilters } from "@/components/shop-filters";
import { DeliverableCard } from "@/components/deliverable-card";

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

  return (
    <div>
      <section className="bg-green px-7 pb-[90px] pt-12">
        <div className="mx-auto max-w-[1240px]">
          <h1 className="text-[42px] font-bold text-white">Deliverables menu</h1>
          <p className="mt-3 max-w-[56ch] text-[17px] text-[#DCEFE7]">
            Twenty-one finished artifacts, each priced on the front. Add the ones you need to your cart.
          </p>
        </div>
      </section>

      <ShopFilters resultLabel={`${items.length} of ${stats.count} deliverables`} />

      <section className="mx-auto max-w-[1240px] px-7 pb-20 pt-6">
        <div className="grid grid-cols-[repeat(auto-fill,minmax(272px,1fr))] gap-5">
          {items.map((item) => (
            <DeliverableCard key={item.id} item={item} variant="shop" />
          ))}
        </div>

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
