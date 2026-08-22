import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { OrderAdminPanel } from "@/components/admin/order-admin-panel";

export default async function AdminOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const order = await prisma.order.findUnique({
    where: { id },
    include: { user: true, lines: { include: { deliverable: true, files: true } } }
  });
  if (!order) notFound();

  return (
    <div className="max-w-[760px]">
      <h1 className="text-[28px] font-bold">{order.displayId}</h1>
      <div className="mt-6">
        <OrderAdminPanel
          order={{
            ...order,
            lines: order.lines.map((l) => ({ ...l, files: l.files.map((f) => ({ ...f, createdAt: f.createdAt.toISOString() })) }))
          }}
        />
      </div>
    </div>
  );
}
