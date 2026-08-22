import { notFound } from "next/navigation";
import { getDeliverableBySlug } from "@/lib/queries/deliverables";
import { DeliverableDetailModal } from "@/components/deliverable-detail-modal";

export default async function DeliverableModalPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const item = await getDeliverableBySlug(slug);
  if (!item) notFound();

  return <DeliverableDetailModal item={item} />;
}
