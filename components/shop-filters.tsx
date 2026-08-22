"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { CATEGORIES } from "@/prisma/catalog-data";

const TIERS = ["All", "Tier 1", "Tier 2", "Tier 3"];
const CATS = ["All", ...CATEGORIES];

export function ShopFilters({ resultLabel }: { resultLabel: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const tier = params.get("tier") ?? "All";
  const cat = params.get("cat") ?? "All";
  const sort = params.get("sort") ?? "featured";
  const query = params.get("q") ?? "";

  function update(next: Record<string, string>) {
    const sp = new URLSearchParams(params.toString());
    for (const [k, v] of Object.entries(next)) {
      if (!v || v === "All" || (k === "sort" && v === "featured")) sp.delete(k);
      else sp.set(k, v);
    }
    router.push(`${pathname}?${sp.toString()}`);
  }

  return (
    <>
      <div className="mx-auto -mt-14 max-w-[1240px] px-7">
        <div className="rounded-[20px] border border-line bg-white p-5 shadow-[0_8px_26px_rgba(66,82,6,.07)]">
          <FilterRow label="Tier">
            {TIERS.map((t) => (
              <Chip key={t} active={tier === t} onClick={() => update({ tier: t })}>
                {t}
              </Chip>
            ))}
          </FilterRow>
          <div className="my-4 h-px bg-[#EFEDE2]" />
          <FilterRow label="Category">
            {CATS.map((c) => (
              <Chip key={c} active={cat === c} onClick={() => update({ cat: c })}>
                {c}
              </Chip>
            ))}
          </FilterRow>
          <div className="my-4 h-px bg-[#EFEDE2]" />
          <div className="flex flex-wrap items-center justify-between gap-[14px]">
            <span className="text-[14px] text-faint">{resultLabel}</span>
            <div className="flex items-center gap-[10px]">
              <input
                value={query}
                onChange={(e) => update({ q: e.target.value })}
                placeholder='Try "workflow" or "AI"'
                className="rounded-[10px] border border-line3 px-[13px] py-[9px] text-[14px] outline-none focus:border-green"
              />
              <span className="text-[13.5px] text-faint">Sort</span>
              <select
                value={sort}
                onChange={(e) => update({ sort: e.target.value })}
                className="rounded-[10px] border border-line3 bg-white px-[13px] py-[9px] font-medium"
              >
                <option value="featured">Featured</option>
                <option value="low">Price: low to high</option>
                <option value="high">Price: high to low</option>
                <option value="az">Name: A–Z</option>
              </select>
              <button
                onClick={() => router.push(pathname)}
                className="rounded-[10px] border border-line3 px-[14px] py-[9px] text-[13.5px] font-semibold text-muted hover:border-green"
              >
                Clear
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function FilterRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-[10px]">
      <span className="mr-1 text-[12.5px] font-semibold uppercase tracking-[0.06em] text-faint">{label}</span>
      {children}
    </div>
  );
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full border px-[15px] py-2 text-[13.5px] font-semibold ${
        active ? "border-forest bg-forest text-[#F3F5E8]" : "border-line3 bg-white text-muted"
      }`}
    >
      {children}
    </button>
  );
}
