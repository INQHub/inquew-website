import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatCents } from "@/lib/money";

export default async function AdminDeliverablesPage() {
  const items = await prisma.deliverable.findMany({ orderBy: { sortOrder: "asc" } });

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[32px] font-bold">Deliverables</h1>
          <p className="mt-2 text-muted">{items.length} items in the catalog.</p>
        </div>
        <Link href="/admin/deliverables/new" className="rounded-xl bg-cyan px-5 py-3 font-semibold text-cyan-ink">
          New deliverable
        </Link>
      </div>

      <div className="mt-6 overflow-x-auto rounded-[20px] border border-line bg-white">
        <table className="w-full min-w-[720px] text-[14px]">
          <thead>
            <tr className="border-b border-line2 bg-sand text-left text-[11.5px] font-bold uppercase tracking-[0.06em] text-faint">
              <th className="px-5 py-3">Title</th>
              <th className="px-5 py-3">Tier</th>
              <th className="px-5 py-3">Price</th>
              <th className="px-5 py-3">Category</th>
              <th className="px-5 py-3">Active</th>
            </tr>
          </thead>
          <tbody>
            {items.map((d) => (
              <tr key={d.id} className="border-b border-[#F3F1E7] hover:bg-[#FCFBF6]">
                <td className="px-5 py-3">
                  <Link href={`/admin/deliverables/${d.id}`} className="font-semibold text-ink hover:text-green">
                    {d.title}
                  </Link>
                  <div className="text-[12px] text-faint">{d.slug}</div>
                </td>
                <td className="px-5 py-3">Tier {d.tier}</td>
                <td className="px-5 py-3 font-display font-bold text-green">{formatCents(d.priceCents)}</td>
                <td className="px-5 py-3 text-muted">{d.category}</td>
                <td className="px-5 py-3">{d.active ? "Yes" : "No"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
