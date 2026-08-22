import Link from "next/link";
import { auth } from "@/lib/auth";
import { getOrdersForUser, getLatestChosenStatement, STATUS_LABEL, STATUS_STYLE } from "@/lib/queries/orders";
import { TIER_COLOR, TIER_LABEL } from "@/lib/catalog";
import { formatCents } from "@/lib/money";

const ACTIVE_STATUSES = ["PAID", "ASSIGNED", "IN_REVIEW", "AWAITING_CLIENT_REVIEW"];
const PAID_STATUSES = [...ACTIVE_STATUSES, "DELIVERED"];

export default async function DashboardOverviewPage() {
  const session = await auth();
  const userId = session!.user.id;
  const [orders, chosenText] = await Promise.all([getOrdersForUser(userId), getLatestChosenStatement(userId)]);

  const active = orders.filter((o) => ACTIVE_STATUSES.includes(o.status));
  const quarterStart = new Date();
  quarterStart.setMonth(Math.floor(quarterStart.getMonth() / 3) * 3, 1);
  quarterStart.setHours(0, 0, 0, 0);
  const deliveredThisQuarter = orders.filter((o) => o.status === "DELIVERED" && o.updatedAt >= quarterStart).length;
  const editCreditsRemaining = active.reduce(
    (sum, o) => sum + o.lines.reduce((s, l) => s + Math.max(0, l.editsIncluded - l.editsUsed), 0),
    0
  );
  const spentToDate = orders.filter((o) => PAID_STATUSES.includes(o.status)).reduce((s, o) => s + o.subtotalCents, 0);

  const firstName = (session!.user.name ?? "there").split(" ")[0];

  return (
    <div>
      <h1 className="text-[32px] font-bold">Welcome back, {firstName}</h1>
      <p className="mt-2 text-muted">
        {active.length} {active.length === 1 ? "deliverable" : "deliverables"} in progress.
      </p>

      <div className="mt-[26px] grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-4">
        <Stat value={String(active.length)} label="Active deliverables" tint="#EFF6F2" ink="#2D7B5F" />
        <Stat value={String(deliveredThisQuarter)} label="Delivered this quarter" tint="#F2F5E6" ink="#4F6110" />
        <Stat value={String(editCreditsRemaining)} label="Edit credits remaining" tint="#FBF7EA" ink="#978E4C" />
        <Stat value={formatCents(spentToDate)} label="Spent to date" tint="#F1FBFC" ink="#1F8E96" />
      </div>

      <div className="mt-[22px] grid grid-cols-[repeat(auto-fit,minmax(300px,1fr))] items-start gap-5">
        <div className="rounded-[20px] border border-line bg-white p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-[19px] font-semibold">Active deliverables</h3>
            <Link href="/dashboard/orders" className="text-[13.5px] font-semibold text-green">
              View all
            </Link>
          </div>
          <div className="mt-[18px] grid gap-[14px]">
            {active.length === 0 && <p className="text-[14px] text-muted">Nothing in progress right now.</p>}
            {active.map((o) => {
              const style = STATUS_STYLE[o.status];
              return (
                <Link
                  key={o.id}
                  href="/dashboard/orders"
                  className="rounded-[15px] border border-[#EFEDE2] p-4 hover:border-green-border hover:bg-[#FCFBF6]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <span
                        className="rounded-full px-[9px] py-[3px] text-[10.5px] font-bold text-white"
                        style={{ background: TIER_COLOR[o.lines[0]?.deliverable.tier ?? 1] }}
                      >
                        {TIER_LABEL[o.lines[0]?.deliverable.tier ?? 1]}
                      </span>
                      <div className="mt-2 font-display text-[16.5px] font-semibold">
                        {o.lines.map((l) => l.deliverable.title).join(", ")}
                      </div>
                      <div className="mt-[3px] text-[12.5px] text-faint">
                        Ordered {o.createdAt.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })} ·{" "}
                        {formatCents(o.subtotalCents)}
                      </div>
                    </div>
                    <span
                      className="flex-shrink-0 rounded-full px-[11px] py-[5px] text-[11.5px] font-semibold"
                      style={{ background: style.bg, color: style.fg }}
                    >
                      {STATUS_LABEL[o.status]}
                    </span>
                  </div>
                  <div className="mt-[14px] h-[6px] overflow-hidden rounded-full bg-[#EFEDE2]">
                    <div className="h-full rounded-full bg-cyan-hover" style={{ width: `${o.progressPct}%` }} />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        <div className="grid gap-5">
          <div className="rounded-[20px] border border-line bg-white p-6">
            <h3 className="text-[19px] font-semibold">Edit credits</h3>
            <p className="mt-[6px] text-[13.5px] text-faint">Revisions remaining per active order.</p>
            <div className="mt-4 grid gap-3">
              {active.length === 0 && <p className="text-[14px] text-muted">No active orders.</p>}
              {active.map((o) =>
                o.lines.map((l) => {
                  const left = Math.max(0, l.editsIncluded - l.editsUsed);
                  return (
                    <div key={l.id} className="flex items-center justify-between gap-3">
                      <span className="min-w-0 flex-1 truncate text-[14px]">{l.deliverable.title}</span>
                      <span className="font-display text-[15px] font-bold" style={{ color: left > 0 ? "#2D7B5F" : "#978E4C" }}>
                        {left} of {l.editsIncluded}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
            <p className="mt-4 text-[12.5px] text-faint">Out of credits? Buy a single edit, or escalate to a consultant call.</p>
          </div>

          {chosenText && (
            <div className="rounded-[20px] border border-green-border bg-green-tint p-6">
              <h3 className="text-[17px] font-semibold text-green">Your problem statement</h3>
              <p className="mt-2 text-[14px] text-[#4A6B5A]">&quot;{chosenText}&quot;</p>
              <Link href="/intake" className="mt-[14px] inline-block text-[13.5px] font-semibold text-green underline">
                Start a new intake
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Stat({ value, label, tint, ink }: { value: string; label: string; tint: string; ink: string }) {
  return (
    <div className="rounded-[18px] border border-line bg-white p-5">
      <div className="flex h-[34px] w-[34px] items-center justify-center rounded-[10px]" style={{ background: tint }}>
        <span className="h-[10px] w-[10px] rounded-[3px]" style={{ background: ink }} />
      </div>
      <div className="mt-[14px] font-display text-[29px] font-bold">{value}</div>
      <div className="text-[13px] text-faint">{label}</div>
    </div>
  );
}
