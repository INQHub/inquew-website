import Link from "next/link";
import { getAdminOverviewStats, getEventCounts } from "@/lib/queries/admin";
import { formatCents } from "@/lib/money";

const FUNNEL_LABEL: Record<string, string> = {
  page_view: "Page views",
  intake_started: "Intake started",
  intake_consented: "Consented",
  recording_started: "Recording started",
  recording_completed: "Recording completed",
  statement_selected: "Statement selected",
  add_to_cart: "Added to cart",
  checkout_started: "Checkout started",
  order_placed: "Order placed"
};

export default async function AdminOverviewPage() {
  const since = new Date(Date.now() - 30 * 86_400_000);
  const [stats, funnel] = await Promise.all([getAdminOverviewStats(), getEventCounts(since)]);
  const maxCount = Math.max(1, ...funnel.map((f) => f.count));

  return (
    <div>
      <h1 className="text-[32px] font-bold">Admin overview</h1>
      <p className="mt-2 text-muted">Last 30 days.</p>

      <div className="mt-6 grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-4">
        <Stat value={String(stats.orderCount)} label="Paid orders" />
        <Stat value={formatCents(stats.revenueCents)} label="Revenue" />
        <Stat value={String(stats.userCount)} label="Client accounts" />
        <Stat value={String(stats.pendingOrders)} label="In the pipeline" />
      </div>

      <div className="mt-6 rounded-[20px] border border-line bg-white p-6">
        <div className="flex items-center justify-between">
          <h3 className="text-[19px] font-semibold">Funnel (30 days)</h3>
          <Link href="/admin/engagement" className="text-[13.5px] font-semibold text-green">
            Full engagement view
          </Link>
        </div>
        <div className="mt-5 grid gap-3">
          {funnel.map((f) => (
            <div key={f.type} className="grid grid-cols-[160px_1fr_50px] items-center gap-3 text-[13.5px]">
              <span className="text-muted">{FUNNEL_LABEL[f.type] ?? f.type}</span>
              <div className="h-[10px] overflow-hidden rounded-full bg-[#EFEDE2]">
                <div className="h-full rounded-full bg-green" style={{ width: `${(f.count / maxCount) * 100}%` }} />
              </div>
              <span className="text-right font-semibold">{f.count}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6 grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-4">
        <QuickLink href="/admin/deliverables" title="Deliverables" body="Edit the catalog, prices, and add-on rules." />
        <QuickLink href="/admin/orders" title="Orders" body="Update status, adjust edits, upload finished files." />
        <QuickLink href="/admin/intakes" title="Intakes" body="Review transcripts and attach manual recordings." />
        <QuickLink href="/admin/users" title="Users" body="Manage roles and account access." />
      </div>
    </div>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-[18px] border border-line bg-white p-5">
      <div className="font-display text-[26px] font-bold text-green">{value}</div>
      <div className="text-[13px] text-faint">{label}</div>
    </div>
  );
}

function QuickLink({ href, title, body }: { href: string; title: string; body: string }) {
  return (
    <Link href={href} className="rounded-[18px] border border-line bg-white p-5 hover:border-green-border">
      <h3 className="text-[16px] font-semibold">{title}</h3>
      <p className="mt-1 text-[13px] text-muted">{body}</p>
    </Link>
  );
}
