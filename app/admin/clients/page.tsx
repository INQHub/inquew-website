import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AdminClientsPage() {
  const clients = await prisma.user.findMany({
    where: { role: "CLIENT" },
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { orders: true, clientFiles: true } },
      intakeSessions: { where: { diagnosedAt: { not: null } }, select: { id: true } },
      threads: { where: { staffUnread: true }, select: { id: true } }
    }
  });

  return (
    <div>
      <h1 className="text-[32px] font-bold">Clients</h1>
      <p className="mt-2 text-muted">{clients.length} client accounts. Open one to see their problem spaces, orders, files and messages.</p>

      <div className="mt-6 overflow-x-auto rounded-[20px] border border-line bg-white">
        <table className="w-full min-w-[760px] text-[14px]">
          <thead>
            <tr className="border-b border-line2 bg-sand text-left text-[11.5px] font-bold uppercase tracking-[0.06em] text-faint">
              <th className="px-5 py-3">Client</th>
              <th className="px-5 py-3">Diagnoses</th>
              <th className="px-5 py-3">Orders</th>
              <th className="px-5 py-3">Files</th>
              <th className="px-5 py-3">Messages</th>
              <th className="px-5 py-3">Joined</th>
            </tr>
          </thead>
          <tbody>
            {clients.length === 0 && (
              <tr>
                <td colSpan={6} className="px-5 py-8 text-muted">No client accounts yet.</td>
              </tr>
            )}
            {clients.map((c) => (
              <tr key={c.id} className="border-b border-[#F3F1E7] hover:bg-[#F7F8F5]">
                <td className="px-5 py-3">
                  <Link href={`/admin/clients/${c.id}`} className="font-semibold text-ink hover:text-green">
                    {c.businessName || c.name || c.email}
                  </Link>
                  <div className="text-[12px] text-faint">
                    {c.name && c.businessName ? `${c.name} · ` : ""}
                    {c.email}
                  </div>
                </td>
                <td className="px-5 py-3">{c.intakeSessions.length}</td>
                <td className="px-5 py-3">{c._count.orders}</td>
                <td className="px-5 py-3">{c._count.clientFiles}</td>
                <td className="px-5 py-3">
                  {c.threads.length > 0 ? (
                    <span className="rounded-full bg-sky px-[9px] py-[3px] text-[11.5px] font-bold text-forest">{c.threads.length} unread</span>
                  ) : (
                    <span className="text-faint">—</span>
                  )}
                </td>
                <td className="px-5 py-3 text-muted">{c.createdAt.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
