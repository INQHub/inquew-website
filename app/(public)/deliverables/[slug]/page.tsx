import { notFound } from "next/navigation";
import { getDeliverableBySlug } from "@/lib/queries/deliverables";
import { DeliverableDetail } from "@/components/deliverable-detail";

export default async function DeliverableDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const item = await getDeliverableBySlug(slug);
  if (!item) notFound();

  return (
    <section className="mx-auto max-w-[800px] px-5 py-10">
      <div className="overflow-hidden rounded-3xl bg-white shadow-card">
        <DeliverableDetail item={item} />
      </div>
    </section>
  );
}
