import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { STATUS_LABEL, STATUS_STYLE } from "@/lib/queries/orders";
import { formatCents } from "@/lib/money";

export default async function AdminOrdersPage() {
  const orders = await prisma.order.findMany({
    include: { user: true, lines: { include: { deliverable: true } } },
    orderBy: { createdAt: "desc" }
  });

  return (
    <div>
      <h1 className="text-[32px] font-bold">Orders</h1>
      <p className="mt-2 text-muted">{orders.length} orders across all clients.</p>

      <div className="mt-6 overflow-x-auto rounded-[20px] border border-line bg-white">
        <table className="w-full min-w-[760px] text-[14px]">
          <thead>
            <tr className="border-b border-line2 bg-sand text-left text-[11.5px] font-bold uppercase tracking-[0.06em] text-faint">
              <th className="px-5 py-3">Order</th>
              <th className="px-5 py-3">Client</th>
              <th className="px-5 py-3">Status</th>
              <th className="px-5 py-3">Total</th>
              <th className="px-5 py-3">Placed</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => {
              const style = STATUS_STYLE[o.status];
              return (
                <tr key={o.id} className="border-b border-[#F3F1E7] hover:bg-[#FCFBF6]">
                  <td className="px-5 py-3">
                    <Link href={`/admin/orders/${o.id}`} className="font-semibold text-ink hover:text-green">
                      {o.displayId}
                    </Link>
                    <div className="text-[12px] text-faint">{o.lines.map((l) => l.deliverable.title).join(", ")}</div>
                  </td>
                  <td className="px-5 py-3 text-muted">{o.user?.email}</td>
                  <td className="px-5 py-3">
                    <span className="rounded-full px-[10px] py-[5px] text-[11.5px] font-semibold" style={{ background: style.bg, color: style.fg }}>
                      {STATUS_LABEL[o.status]}
                    </span>
                  </td>
                  <td className="px-5 py-3 font-display font-bold text-green">{formatCents(o.subtotalCents)}</td>
                  <td className="px-5 py-3 text-muted">
                    {o.createdAt.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
