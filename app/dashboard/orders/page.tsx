import { auth } from "@/lib/auth";
import { getOrdersForUser, STATUS_LABEL, STATUS_STYLE } from "@/lib/queries/orders";
import { formatCents } from "@/lib/money";

export default async function DashboardOrdersPage() {
  const session = await auth();
  const orders = await getOrdersForUser(session!.user.id);

  return (
    <div>
      <h1 className="text-[32px] font-bold">Orders</h1>
      <p className="mt-2 text-muted">Every deliverable you&apos;ve bought, with its review stage.</p>

      <div className="mt-6 overflow-hidden rounded-[20px] border border-line bg-white">
        <div className="grid grid-cols-[2fr_1fr_1fr_1fr] gap-3 border-b border-line2 bg-sand px-5 py-[14px] text-[11.5px] font-bold uppercase tracking-[0.06em] text-faint">
          <span>Deliverable</span>
          <span>Ordered</span>
          <span>Status</span>
          <span>Price</span>
        </div>
        {orders.length === 0 && <div className="p-6 text-[14px] text-muted">No orders yet.</div>}
        {orders.map((o) => {
          const style = STATUS_STYLE[o.status];
          return (
            <div key={o.id} className="grid grid-cols-[2fr_1fr_1fr_1fr] items-center gap-3 border-b border-[#F3F1E7] px-5 py-4 text-[14px]">
              <div>
                <div className="font-semibold">{o.lines.map((l) => l.deliverable.title).join(", ")}</div>
                <div className="mt-[2px] text-[12px] text-faint">
                  {o.lines.map((l) => `Tier ${l.deliverable.tier}`).join(", ")}
                </div>
              </div>
              <span className="text-muted">{o.createdAt.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
              <span>
                <span className="rounded-full px-[10px] py-[5px] text-[11.5px] font-semibold" style={{ background: style.bg, color: style.fg }}>
                  {STATUS_LABEL[o.status]}
                </span>
              </span>
              <span className="font-display font-bold text-green">{formatCents(o.subtotalCents)}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
