import type { OrderStatus } from "@prisma/client";

/** The four client-facing stages of a deliverable, from the V2 brief. */
export const STAGES = [
  { label: "Received your diagnosis", sub: "Order confirmed" },
  { label: "Building your deliverable", sub: "Inquew's AI agents are building it" },
  { label: "Polishing and final feedback", sub: "A consultant is checking quality" },
  { label: "Completed", sub: "Ready in Downloads" }
] as const;

/** Index into STAGES for an order status; -1 when the order isn't in progress. */
export function stageIndex(status: OrderStatus): number {
  switch (status) {
    case "PAID":
      return 0;
    case "ASSIGNED":
      return 1;
    case "IN_REVIEW":
    case "AWAITING_CLIENT_REVIEW":
      return 2;
    case "DELIVERED":
      return 3;
    default:
      return -1;
  }
}
