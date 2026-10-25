"use client";

import { useRouter } from "next/navigation";
import { useCart } from "@/components/cart-context";
import { useCatalog } from "@/components/use-catalog";
import { useTrackEvent } from "@/components/use-track-event";
import { FOUNDERS_PACKAGE, foundersDiscountCents } from "@/lib/bundles";
import { formatCents } from "@/lib/money";

/** Featured "Start here" tile that adds all three Founders Package deliverables at once. */
export function FoundersPackageTile() {
  const { items, loading } = useCatalog();
  const cart = useCart();
  const router = useRouter();
  const track = useTrackEvent();

  const parts = FOUNDERS_PACKAGE.slugs
    .map((slug) => items.find((i) => i.slug === slug))
    .filter((i): i is NonNullable<typeof i> => !!i);
  if (!loading && parts.length !== FOUNDERS_PACKAGE.slugs.length) return null;

  const fullCents = parts.reduce((sum, p) => sum + p.priceCents, 0);
  const discount = foundersDiscountCents(parts.map((p) => ({ slug: p.slug, priceCents: p.priceCents })));

  function addPackage() {
    for (const p of parts) cart.add(p.id);
    track("add_to_cart", { source: "founders_package" });
    router.push("/cart");
  }

  return (
    <div className="flex flex-wrap items-center gap-8 rounded-3xl bg-green-tint p-8 md:p-10">
      <img src="/assets/mascots/briefcase.png" alt="" className="h-[120px] w-auto" />
      <div className="min-w-0 flex-[1_1_380px]">
        <span className="inline-block rounded-full bg-forest px-3 py-[5px] text-[12px] font-bold tracking-[0.06em] text-white">
          START HERE · FOR FOUNDERS
        </span>
        <h2 className="mt-3 text-[30px] font-extrabold">{FOUNDERS_PACKAGE.name}</h2>
        <p className="mt-2 text-[16.5px] text-[#36423B]">
          {parts.length ? parts.map((p) => p.title).join(" + ") : "Customer Discovery, Go-to-Market Strategy and a Funding Roadmap"}
          , bought together.
        </p>
      </div>
      <div className="flex flex-col items-start gap-2">
        <div className="flex items-baseline gap-3">
          <span className="font-display text-[40px] font-extrabold text-forest">
            {loading ? "…" : formatCents(fullCents - discount)}
          </span>
          {!loading && <s className="text-[19px] text-faint">{formatCents(fullCents)}</s>}
        </div>
        <span className="rounded-full bg-olive-tint px-3 py-1 text-[13px] font-bold text-olive">
          Save {FOUNDERS_PACKAGE.discountPct}%
        </span>
        <button
          type="button"
          onClick={addPackage}
          disabled={loading}
          className="rounded-full bg-green px-6 py-[13px] font-semibold text-white disabled:opacity-60"
        >
          Add the package to cart
        </button>
      </div>
    </div>
  );
}
