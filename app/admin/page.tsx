import Link from "next/link";
import { getEventCounts } from "@/lib/queries/admin";
import { getCommandCenter, queueHealth, AT_RISK_DAYS, OVERDUE_DAYS } from "@/lib/queries/command-center";
import { STATUS_LABEL, STATUS_STYLE } from "@/lib/queries/orders";
import { formatCents } from "@/lib/money";

export const dynamic = "force-dynamic";

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

export default async function AdminCommandCenterPage() {
  const since = new Date(Date.now() - 30 * 86_400_000);
  const [cc, funnel] = await Promise.all([getCommandCenter(), getEventCounts(since)]);
  const maxCount = Math.max(1, ...funnel.map((f) => f.count));
  const now = Date.now();

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-[32px] font-bold">Command center</h1>
        <p className="mt-1 text-muted">AI agents build each deliverable; your job is quality control and client contact.</p>
      </div>

      <div className="grid grid-cols-[repeat(auto-fit,minmax(170px,1fr))] gap-4">
        <Stat value={String(cc.kpis.ordersThisWeek)} label="Orders this week" />
        <Stat value={formatCents(cc.kpis.revenueMonthCents)} label="Revenue this month" />
        <Stat value={String(cc.kpis.queued)} label="Queued" />
        <Stat value={String(cc.kpis.inProgress)} label="In progress" />
        <Stat value={String(cc.kpis.clients)} label="Client accounts" href="/admin/clients" />
        <Stat value={String(cc.kpis.pro + cc.kpis.premium)} label={`Subscribers · ${cc.kpis.pro} Pro / ${cc.kpis.premium} Premium`} />
        <Stat value={String(cc.kpis.unreadThreads)} label="Unread client messages" href="/admin/client-messages" alert={cc.kpis.unreadThreads > 0} />
      </div>

      <section className="rounded-[20px] border border-line bg-white p-6">
        <h2 className="text-[19px] font-semibold">Pipeline</h2>
        <div className="mt-4 grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-3">
          {cc.pipeline.map((p) => (
            <Link key={p.label} href={p.href} className="rounded-[14px] bg-sand p-4 hover:bg-green-tint">
              <div className="font-display text-[26px] font-bold text-forest">{p.n}</div>
              <div className="text-[13px] text-muted">{p.label}</div>
            </Link>
          ))}
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(280px,1fr)]">
        <section className="overflow-hidden rounded-[20px] border border-line bg-white">
          <div className="flex flex-wrap items-baseline justify-between gap-2 p-6 pb-3">
            <h2 className="text-[19px] font-semibold">Work queue</h2>
            <span className="text-[12.5px] text-faint">
              At risk after {AT_RISK_DAYS} days · overdue after {OVERDUE_DAYS}
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-[14px]">
              <thead>
                <tr className="border-y border-line2 bg-sand text-left text-[11.5px] font-bold uppercase tracking-[0.06em] text-faint">
                  <th className="px-5 py-3">Order</th>
                  <th className="px-5 py-3">Client</th>
                  <th className="px-5 py-3">Stage</th>
                  <th className="px-5 py-3">Health</th>
                </tr>
              </thead>
              <tbody>
                {cc.queue.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-5 py-8 text-muted">
                      Nothing in the queue. New paid orders show up here.
                    </td>
                  </tr>
                )}
                {cc.queue.map((o) => {
                  const h = queueHealth(o.createdAt, now);
                  const s = STATUS_STYLE[o.status];
                  return (
                    <tr key={o.id} className="border-b border-[#F3F1E7] align-top hover:bg-[#F7F8F5]">
                      <td className="px-5 py-3">
                        <Link href={`/admin/orders/${o.id}`} className="font-semibold text-ink hover:text-green">
                          {o.displayId}
                        </Link>
                        <div className="text-[12px] text-faint">{o.lines.map((l) => l.deliverable.title).join(", ")}</div>
                      </td>
                      <td className="px-5 py-3">
                        <Link href={`/admin/clients/${o.user.id}`} className="text-muted hover:text-green">
                          {o.user.businessName || o.user.name || o.user.email}
                        </Link>
                      </td>
                      <td className="px-5 py-3">
                        <span className="whitespace-nowrap rounded-full px-[10px] py-[5px] text-[11.5px] font-semibold" style={{ background: s.bg, color: s.fg }}>
                          {STATUS_LABEL[o.status]}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <span className="whitespace-nowrap rounded-full px-[10px] py-[5px] text-[11.5px] font-semibold" style={{ background: h.bg, color: h.fg }}>
                          {h.label}
                        </span>
                        <div className="mt-1 text-[12px] text-faint">{h.days === 0 ? "Today" : `${h.days}d old`}</div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        <section className="rounded-[20px] border border-line bg-white p-6">
          <h2 className="text-[19px] font-semibold">Activity</h2>
          <ul className="mt-4 grid gap-3">
            {cc.activity.length === 0 && <li className="text-[14px] text-muted">No activity yet.</li>}
            {cc.activity.map((a, i) => (
              <li key={i} className="border-l-[3px] border-sky pl-3">
                <Link href={a.href} className="text-[14px] font-medium text-ink hover:text-green">
                  {a.text}
                </Link>
                <div className="text-[12px] text-faint">
                  {a.at.toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
                </div>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <section className="rounded-[20px] border border-line bg-white p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-[19px] font-semibold">Funnel (30 days)</h2>
          <Link href="/admin/engagement" className="text-[13.5px] font-semibold text-green">
            Full engagement view
          </Link>
        </div>
        <div className="mt-5 grid gap-3">
          {funnel.map((f) => (
            <div key={f.type} className="grid grid-cols-[160px_1fr_50px] items-center gap-3 text-[13.5px]">
              <span className="text-muted">{FUNNEL_LABEL[f.type] ?? f.type}</span>
              <div className="h-[10px] overflow-hidden rounded-full bg-[#E3E7E1]">
                <div className="h-full rounded-full bg-green" style={{ width: `${(f.count / maxCount) * 100}%` }} />
              </div>
              <span className="text-right font-semibold">{f.count}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function Stat({ value, label, href, alert }: { value: string; label: string; href?: string; alert?: boolean }) {
  const inner = (
    <div className={`h-full rounded-[18px] border bg-white p-5 ${alert ? "border-sky" : "border-line"}`}>
      <div className="font-display text-[26px] font-bold text-green">{value}</div>
      <div className="text-[13px] text-faint">{label}</div>
    </div>
  );
  return href ? <Link href={href}>{inner}</Link> : inner;
}
