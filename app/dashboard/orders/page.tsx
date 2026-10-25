import Link from "next/link";
import { auth } from "@/lib/auth";
import { getOrdersForUser, STATUS_LABEL, STATUS_STYLE } from "@/lib/queries/orders";
import { formatCents } from "@/lib/money";
import { BuyAgainButton } from "@/components/portal/buy-again-button";

export default async function PurchaseHistoryPage() {
  const session = await auth();
  const orders = await getOrdersForUser(session!.user.id);

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-center gap-4">
        <img src="/assets/mascots/briefcase.png" alt="" className="h-[56px] w-auto" />
        <div>
          <h1 className="text-[32px] font-bold">Purchase history</h1>
          <p className="text-muted">Every order, with its status, terms acceptance and files.</p>
        </div>
      </div>

      <div className="overflow-x-auto rounded-[20px] border border-line bg-white">
        <table className="w-full min-w-[900px] border-collapse text-[14.5px]">
          <thead>
            <tr className="bg-sand text-left text-[12px] font-bold uppercase tracking-[0.06em] text-faint">
              <th className="px-5 py-3">Deliverable</th>
              <th className="px-5 py-3">Ordered</th>
              <th className="px-5 py-3">Status</th>
              <th className="px-5 py-3">Terms</th>
              <th className="px-5 py-3">Price</th>
              <th className="px-5 py-3">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {orders.length === 0 && (
              <tr>
                <td colSpan={6} className="px-5 py-8 text-muted">
                  No orders yet. <Link href="/deliverables">Browse deliverables</Link>
                </td>
              </tr>
            )}
            {orders.map((o) => {
              const style = STATUS_STYLE[o.status];
              const hasFiles = o.lines.some((l) => l.files.length > 0);
              return (
                <tr key={o.id} className="border-t border-line align-top">
                  <td className="px-5 py-4">
                    <div className="font-semibold text-forest">{o.lines.map((l) => l.deliverable.title).join(", ")}</div>
                    <div className="mt-[2px] text-[12.5px] text-faint">
                      {o.displayId} · {o.lines.map((l) => `Tier ${l.deliverable.tier}`).join(", ")}
                    </div>
                  </td>
                  <td className="px-5 py-4 text-muted">
                    {o.createdAt.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </td>
                  <td className="px-5 py-4">
                    <span className="whitespace-nowrap rounded-full px-[10px] py-[5px] text-[12px] font-semibold" style={{ background: style.bg, color: style.fg }}>
                      {STATUS_LABEL[o.status]}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-[12.5px] text-muted">
                    {o.termsAcceptedAt
                      ? `Accepted ${o.termsAcceptedAt.toLocaleString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                          hour: "numeric",
                          minute: "2-digit"
                        })} · v${o.termsVersion}`
                      : "—"}
                  </td>
                  <td className="px-5 py-4 font-display font-bold text-green">
                    {formatCents(o.subtotalCents)}
                    {o.discountCents > 0 && (
                      <span className="block text-[12px] font-normal text-faint">incl. {formatCents(o.discountCents)} discount</span>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-5 py-4">
                    <span className="inline-flex flex-wrap gap-3">
                      {hasFiles && (
                        <Link href="/dashboard/downloads" className="font-semibold underline">
                          Downloads
                        </Link>
                      )}
                      <BuyAgainButton deliverableIds={o.lines.map((l) => l.deliverableId)} />
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="text-[13px] text-faint">Receipts are emailed after every order.</p>
    </div>
  );
}
