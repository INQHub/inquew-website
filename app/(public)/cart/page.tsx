"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart } from "@/components/cart-context";
import { useCatalog } from "@/components/use-catalog";
import { useTrackEvent } from "@/components/use-track-event";
import { TierBadge } from "@/components/tier-badge";
import { PlaceholderArt } from "@/components/placeholder-art";
import { formatCents } from "@/lib/money";
import { editsLabel, ADDON_PRICE_CENTS } from "@/lib/catalog";

export default function CartPage() {
  const cart = useCart();
  const { byId, loading } = useCatalog();
  const router = useRouter();
  const track = useTrackEvent();

  const resolved = cart.lines.map((l) => ({ line: l, item: byId.get(l.deliverableId) })).filter((r) => r.item);

  const itemsTotal = resolved.reduce((a, r) => a + (r.item?.priceCents ?? 0), 0);
  const addonTotal = resolved.reduce(
    (a, r) => a + (r.line.video ? ADDON_PRICE_CENTS.video : 0) + (r.line.zoom ? ADDON_PRICE_CENTS.zoom : 0),
    0
  );

  return (
    <section className="mx-auto max-w-[1100px] px-7 pb-20 pt-[60px]">
      <h1 className="text-[42px] font-bold">Your cart</h1>

      {!loading && resolved.length === 0 && (
        <div className="mt-8 rounded-[22px] border border-line bg-white p-[60px] text-center">
          <h3 className="text-[24px] font-semibold">Nothing here yet</h3>
          <p className="mt-[10px] text-muted">
            Start with an intake and we&apos;ll recommend what fits, or go straight to the menu.
          </p>
          <div className="mt-[26px] flex flex-wrap justify-center gap-[14px]">
            <Link href="/intake" className="rounded-xl bg-cyan px-6 py-[15px] font-semibold text-cyan-ink">
              Start a video intake
            </Link>
            <Link href="/deliverables" className="rounded-xl border border-[#CFD8B8] bg-white px-6 py-[15px] font-semibold">
              Browse the menu
            </Link>
          </div>
        </div>
      )}

      {resolved.length > 0 && (
        <div className="mt-8 grid grid-cols-[repeat(auto-fit,minmax(320px,1fr))] items-start gap-6">
          <div className="grid gap-4">
            {resolved.map(({ line, item }) => {
              if (!item) return null;
              return (
                <div key={item.id} className="rounded-[20px] border border-line bg-white p-5">
                  <div className="flex items-start gap-4">
                    <PlaceholderArt className="h-[72px] w-[72px] flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <TierBadge tier={item.tier} />
                      <h3 className="mt-2 text-[18px] font-semibold">{item.title}</h3>
                      <p className="mt-1 text-[13.5px] text-faint">
                        {item.category} · {editsLabel(item.tier)}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="font-display text-[21px] font-bold text-green">
                        {formatCents(item.priceCents + (line.video ? ADDON_PRICE_CENTS.video : 0) + (line.zoom ? ADDON_PRICE_CENTS.zoom : 0))}
                      </div>
                      <button
                        onClick={() => {
                          cart.remove(item.id);
                          track("remove_from_cart", { deliverableId: item.id });
                        }}
                        className="mt-2 text-[13px] text-faint underline"
                      >
                        Remove
                      </button>
                    </div>
                  </div>

                  {(item.videoAddon !== "NONE" || item.zoomAddon !== "NONE") && (
                    <div className="mt-4 grid gap-[10px] border-t border-dashed border-line3 pt-4">
                      {item.videoAddon === "INCLUDED" && (
                        <div className="text-[13.5px] font-semibold text-green">
                          Video presentation walkthrough included in base price
                        </div>
                      )}
                      {item.videoAddon === "ADD" && (
                        <AddonToggle
                          checked={line.video}
                          onToggle={() => cart.toggleAddon(item.id, "video")}
                          label="Add a video presentation walkthrough"
                          price="+$35"
                        />
                      )}
                      {item.zoomAddon === "ADD" && (
                        <AddonToggle
                          checked={line.zoom}
                          onToggle={() => cart.toggleAddon(item.id, "zoom")}
                          label="Add a 30-minute Zoom consultation"
                          price="+$45"
                        />
                      )}
                    </div>
                  )}
                </div>
              );
            })}
            <Link
              href="/deliverables"
              className="justify-self-start rounded-xl border border-line3 bg-white px-5 py-[13px] text-[14.5px] font-semibold"
            >
              Add another deliverable
            </Link>
          </div>

          <div className="sticky top-[100px] rounded-[20px] border border-line bg-white p-[26px]">
            <h3 className="text-[20px] font-semibold">Summary</h3>
            <div className="mt-[18px] grid gap-[11px] text-[15px]">
              <Row label={`${resolved.length} ${resolved.length === 1 ? "deliverable" : "deliverables"}`} value={formatCents(itemsTotal)} />
              <Row label="Add-ons" value={addonTotal ? formatCents(addonTotal) : "None selected"} valueClass="text-olive" />
            </div>
            <div className="mt-4 flex items-baseline justify-between border-t border-[#EFEDE2] pt-4">
              <span className="text-[15px] font-semibold">Total</span>
              <span className="font-display text-[28px] font-bold text-green">{formatCents(itemsTotal + addonTotal)}</span>
            </div>
            <p className="mt-2 text-[12.5px] text-faint">Includes any selected add-ons.</p>

            <div className="mt-[22px]">
              <div className="text-[12px] font-bold uppercase tracking-[0.06em] text-faint">How should we deliver?</div>
              <div className="mt-3 grid gap-[10px]">
                <DeliveryOption
                  active={cart.deliveryMethod === "DASHBOARD"}
                  onClick={() => cart.setDeliveryMethod("DASHBOARD")}
                  title="Platform dashboard"
                  tag="Recommended"
                  body="Posted to your secure account. Email notifies you — no attachment."
                />
                <DeliveryOption
                  active={cart.deliveryMethod === "EMAIL"}
                  onClick={() => cart.setDeliveryMethod("EMAIL")}
                  title="Direct email"
                  body="Sent as a secure, expiring link — never a raw attachment."
                />
              </div>
            </div>

            <button
              onClick={() => router.push("/checkout")}
              className="mt-[22px] w-full rounded-[13px] bg-cyan py-4 text-[16px] font-semibold text-cyan-ink hover:bg-cyan-hover"
            >
              Continue to checkout
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

function Row({ label, value, valueClass = "" }: { label: string; value: string; valueClass?: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-muted">{label}</span>
      <span className={`font-semibold ${valueClass}`}>{value}</span>
    </div>
  );
}

function AddonToggle({
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
    <label onClick={onToggle} className="flex cursor-pointer items-center gap-[11px] text-[14.5px]">
      <span
        className="h-[22px] w-[22px] flex-shrink-0 rounded-[7px] border-2"
        style={{ borderColor: checked ? "#2D7B5F" : "#CFCBB8", background: checked ? "#2D7B5F" : "#FFFFFF" }}
      />
      <span className="flex-1">{label}</span>
      <span className="font-semibold text-olive">{price}</span>
    </label>
  );
}

function DeliveryOption({
  active,
  onClick,
  title,
  tag,
  body
}: {
  active: boolean;
  onClick: () => void;
  title: string;
  tag?: string;
  body: string;
}) {
  return (
    <button
      onClick={onClick}
      className="rounded-[13px] border-2 p-[14px] text-left"
      style={{ borderColor: active ? "#2D7B5F" : "#E4E0D2", background: active ? "#EFF6F2" : "#FFFFFF" }}
    >
      <div className="text-[14.5px] font-semibold">
        {title} {tag && <span className="text-[12px] font-semibold text-green">{tag}</span>}
      </div>
      <div className="mt-1 text-[13px] text-muted">{body}</div>
    </button>
  );
}
