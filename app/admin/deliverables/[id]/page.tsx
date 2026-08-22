import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { DeliverableForm } from "@/components/admin/deliverable-form";

export default async function EditDeliverablePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const deliverable = await prisma.deliverable.findUnique({ where: { id } });
  if (!deliverable) notFound();

  return (
    <div className="max-w-[720px]">
      <h1 className="text-[28px] font-bold">{deliverable.title}</h1>
      <div className="mt-6">
        <DeliverableForm deliverable={deliverable} />
      </div>
    </div>
  );
}
