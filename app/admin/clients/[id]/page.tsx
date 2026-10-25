import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { problemCode, readContext } from "@/lib/diagnostic";
import { STATUS_LABEL, STATUS_STYLE } from "@/lib/queries/orders";
import { formatCents } from "@/lib/money";
import { formatBytes } from "@/lib/uploads";
import { FileActions } from "@/components/portal/file-actions";
import { getPlanUsage } from "@/lib/subscriptions";
import { PLANS, usageLine } from "@/lib/plans";

export const dynamic = "force-dynamic";

export default async function AdminClientRecordPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const client = await prisma.user.findUnique({
    where: { id },
    include: {
      intakeSessions: { orderBy: { createdAt: "desc" } },
      orders: { orderBy: { createdAt: "desc" }, include: { lines: { include: { deliverable: { select: { title: true } } } } } },
      clientFiles: { orderBy: { createdAt: "desc" } },
      threads: { orderBy: { lastMessageAt: "desc" }, include: { _count: { select: { messages: true } } } }
    }
  });
  if (!client) notFound();

  const chosenIds = client.intakeSessions.map((i) => i.chosenId).filter((x): x is string => !!x);
  const statements = await prisma.problemStatement.findMany({ where: { id: { in: chosenIds } }, select: { id: true, text: true } });
  const statementById = new Map(statements.map((s) => [s.id, s.text]));
  const intakeCode = new Map(client.intakeSessions.map((i) => [i.id, problemCode(i.id)]));
  const paidTotal = client.orders.filter((o) => o.status !== "PENDING_PAYMENT" && o.status !== "CANCELLED").reduce((n, o) => n + o.subtotalCents, 0);
  const fmt = (d: Date) => d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  const usage = await getPlanUsage(client.id);

  return (
    <div className="grid gap-6">
      <div>
        <Link href="/admin/clients" className="text-[13.5px] font-semibold text-green">
          ← All clients
        </Link>
        <h1 className="mt-2 text-[32px] font-bold">{client.businessName || client.name || client.email}</h1>
        <p className="mt-1 text-muted">
          {[client.name, client.email].filter(Boolean).join(" · ")} · joined {fmt(client.createdAt)} · {formatCents(paidTotal)} lifetime
        </p>
        {usage && (
          <p className="mt-1 text-[14px] text-muted">
            <strong className="text-forest">{PLANS[usage.plan].name}</strong>
            {usage.status && usage.plan !== "FREE" ? ` (${usage.status.replace(/_/g, " ")}${usage.cancelAtPeriodEnd ? ", cancels at period end" : ""})` : ""} ·{" "}
            {usageLine(usage)}
          </p>
        )}
      </div>

      <Card title="Problem spaces and diagnoses">
        {client.intakeSessions.length === 0 ? (
          <Empty>No intakes yet.</Empty>
        ) : (
          <ul className="grid gap-3">
            {client.intakeSessions.map((i) => {
              const ctx = readContext(i.businessContext);
              return (
                <li key={i.id} className="rounded-[14px] border border-line p-4">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="rounded-full bg-green-tint px-[10px] py-[3px] text-[12px] font-bold text-forest">{problemCode(i.id)}</span>
                    <span className="text-[12.5px] text-faint">
                      {i.diagnosedAt ? `Diagnosed ${fmt(i.diagnosedAt)}` : `Started ${fmt(i.createdAt)} · ${i.status.replace(/_/g, " ").toLowerCase()}`}
                    </span>
                    {[ctx.industry, ctx.department].filter(Boolean).map((t) => (
                      <span key={t} className="text-[12.5px] text-muted">{t}</span>
                    ))}
                    <span className="ml-auto flex gap-4 text-[13px] font-semibold">
                      <Link href={`/admin/intakes/${i.id}`} className="text-green">Intake</Link>
                      {i.diagnosedAt && <Link href={`/diagnosis/${i.id}`} className="text-green">Diagnosis</Link>}
                    </span>
                  </div>
                  {i.chosenId && statementById.get(i.chosenId) && (
                    <p className="mt-2 text-[14.5px] text-ink">{statementById.get(i.chosenId)}</p>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </Card>

      <Card title="Orders">
        {client.orders.length === 0 ? (
          <Empty>No orders yet.</Empty>
        ) : (
          <ul className="grid gap-2">
            {client.orders.map((o) => {
              const s = STATUS_STYLE[o.status];
              return (
                <li key={o.id} className="flex flex-wrap items-center gap-3 border-b border-[#F3F1E7] pb-2 text-[14px]">
                  <Link href={`/admin/orders/${o.id}`} className="font-semibold text-ink hover:text-green">{o.displayId}</Link>
                  <span className="text-muted">{o.lines.map((l) => l.deliverable.title).join(", ")}</span>
                  <span className="rounded-full px-[10px] py-[3px] text-[11.5px] font-semibold" style={{ background: s.bg, color: s.fg }}>
                    {STATUS_LABEL[o.status]}
                  </span>
                  <span className="ml-auto font-display font-bold text-green">{formatCents(o.subtotalCents)}</span>
                  <span className="text-[12.5px] text-faint">{fmt(o.createdAt)}</span>
                </li>
              );
            })}
          </ul>
        )}
      </Card>

      <Card title="Business documents">
        {client.clientFiles.length === 0 ? (
          <Empty>The client hasn&apos;t uploaded any documents.</Empty>
        ) : (
          <ul className="grid gap-2">
            {client.clientFiles.map((f) => (
              <li key={f.id} className="flex flex-wrap items-center gap-3 border-b border-[#F3F1E7] pb-2 text-[14px]">
                <span className="font-semibold">{f.fileName}</span>
                <span className="text-[12.5px] text-faint">
                  {[formatBytes(f.sizeBytes), f.intakeId ? intakeCode.get(f.intakeId) : "General", fmt(f.createdAt)].filter(Boolean).join(" · ")}
                </span>
                <span className="ml-auto">
                  <FileActions fileId={f.id} canDelete={false} />
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card title="Messages">
        {client.threads.length === 0 ? (
          <Empty>No conversations yet.</Empty>
        ) : (
          <ul className="grid gap-2">
            {client.threads.map((t) => (
              <li key={t.id} className="flex flex-wrap items-center gap-3 border-b border-[#F3F1E7] pb-2 text-[14px]">
                <Link href={`/admin/client-messages/${t.id}`} className="font-semibold text-ink hover:text-green">{t.subject}</Link>
                {t.staffUnread && <span className="rounded-full bg-sky px-[9px] py-[2px] text-[11px] font-bold text-forest">Unread</span>}
                <span className="ml-auto text-[12.5px] text-faint">
                  {t._count.messages} messages · {fmt(t.lastMessageAt)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-[20px] border border-line bg-white p-6">
      <h2 className="mb-4 text-[19px] font-semibold">{title}</h2>
      {children}
    </section>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return <p className="text-[14px] text-muted">{children}</p>;
}
