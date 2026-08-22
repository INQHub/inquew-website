"use client";

import { useRouter } from "next/navigation";
import { Modal } from "@/components/modal";
import { DeliverableDetail } from "@/components/deliverable-detail";
import type { PublicDeliverable } from "@/lib/types";

export function DeliverableDetailModal({ item }: { item: PublicDeliverable }) {
  const router = useRouter();
  return (
    <Modal>
      <DeliverableDetail item={item} onClose={() => router.back()} />
    </Modal>
  );
}
