import { prisma } from "@/lib/prisma";
import { getEventCounts, FUNNEL_TYPES } from "@/lib/queries/admin";
import { TestImportForm } from "@/components/admin/test-import-form";

const FUNNEL_LABEL: Record<string, string> = {
  page_view: "Page views",
  intake_started: "Intake started",
  intake_consented: "Consented",
  intake_declined: "Declined intake",
  recording_started: "Recording started",
  recording_completed: "Recording completed",
  statement_selected: "Statement selected",
  add_to_cart: "Added to cart",
  remove_from_cart: "Removed from cart",
  checkout_started: "Checkout started",
  order_placed: "Order placed"
};

export default async function AdminEngagementPage({
  searchParams
}: {
  searchParams: Promise<{ days?: string }>;
}) {
  const sp = await searchParams;
  const days = Number(sp.days ?? 30);
  const since = new Date(Date.now() - days * 86_400_000);

  const [funnel, imports] = await Promise.all([
    getEventCounts(since, FUNNEL_TYPES),
    prisma.testResultImport.findMany({ orderBy: { importedAt: "desc" }, take: 20 })
  ]);
  const maxCount = Math.max(1, ...funnel.map((f) => f.count));

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-[32px] font-bold">Engagement</h1>
          <p className="mt-2 text-muted">Funnel and KPI tracking, last {days} days.</p>
        </div>
        <div className="flex gap-2">
          {[7, 30, 90].map((d) => (
            <a
              key={d}
              href={`/admin/engagement?days=${d}`}
              className="rounded-lg border border-line3 px-3 py-1.5 text-[13px] font-semibold"
              style={{ background: d === days ? "#425206" : "#FFFFFF", color: d === days ? "#F3F5E8" : "#425206" }}
            >
              {d}d
            </a>
          ))}
        </div>
      </div>

      <div className="mt-6 rounded-[20px] border border-line bg-white p-6">
        <div className="flex items-center justify-between">
          <h3 className="text-[18px] font-semibold">Funnel</h3>
          <div className="flex gap-3">
            <a href={`/api/admin/export/events?format=csv&days=${days}`} className="text-[13px] font-semibold text-green underline">
              Export CSV
            </a>
            <a href={`/api/admin/export/events?format=json&days=${days}`} className="text-[13px] font-semibold text-green underline">
              Export JSON
            </a>
          </div>
        </div>
        <div className="mt-5 grid gap-3">
          {funnel.map((f) => (
            <div key={f.type} className="grid grid-cols-[180px_1fr_50px] items-center gap-3 text-[13.5px]">
              <span className="text-muted">{FUNNEL_LABEL[f.type] ?? f.type}</span>
              <div className="h-[10px] overflow-hidden rounded-full bg-[#EFEDE2]">
                <div className="h-full rounded-full bg-green" style={{ width: `${(f.count / maxCount) * 100}%` }} />
              </div>
              <span className="text-right font-semibold">{f.count}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6 rounded-[20px] border border-line bg-white p-6">
        <div className="flex items-center justify-between">
          <h3 className="text-[18px] font-semibold">Test result imports</h3>
          <TestImportForm />
        </div>
        <p className="mt-2 text-[13px] text-faint">
          Import a CSV or JSON file of test-run results (e.g. from a synthetic engagement run) to compare against real traffic.
        </p>
        <div className="mt-4 grid gap-2">
          {imports.length === 0 && <p className="text-[14px] text-muted">Nothing imported yet.</p>}
          {imports.map((imp) => (
            <div key={imp.id} className="flex items-center justify-between rounded-lg border border-line2 bg-sand px-4 py-3 text-[13.5px]">
              <span>{imp.fileName}</span>
              <span className="text-faint">
                {imp.rowCount} rows · {imp.format.toUpperCase()} · {imp.importedAt.toLocaleDateString("en-US")}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
