import Link from "next/link";
import { prisma } from "@/lib/prisma";

export default async function AdminIntakesPage() {
  const sessions = await prisma.intakeSession.findMany({
    include: { user: true },
    orderBy: { createdAt: "desc" },
    take: 100
  });

  return (
    <div>
      <h1 className="text-[32px] font-bold">Intake sessions</h1>
      <p className="mt-2 text-muted">{sessions.length} most recent sessions.</p>

      <div className="mt-6 overflow-x-auto rounded-[20px] border border-line bg-white">
        <table className="w-full min-w-[640px] text-[14px]">
          <thead>
            <tr className="border-b border-line2 bg-sand text-left text-[11.5px] font-bold uppercase tracking-[0.06em] text-faint">
              <th className="px-5 py-3">Client</th>
              <th className="px-5 py-3">Status</th>
              <th className="px-5 py-3">Started</th>
            </tr>
          </thead>
          <tbody>
            {sessions.map((s) => (
              <tr key={s.id} className="border-b border-[#F3F1E7] hover:bg-[#FCFBF6]">
                <td className="px-5 py-3">
                  <Link href={`/admin/intakes/${s.id}`} className="font-semibold text-ink hover:text-green">
                    {s.user?.email ?? "Guest"}
                  </Link>
                </td>
                <td className="px-5 py-3 text-muted">{s.status}</td>
                <td className="px-5 py-3 text-muted">
                  {s.createdAt.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
