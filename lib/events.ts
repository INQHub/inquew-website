import { prisma } from "@/lib/prisma";

export const EVENT = {
  PAGE_VIEW: "page_view",
  INTAKE_STARTED: "intake_started",
  INTAKE_CONSENTED: "intake_consented",
  INTAKE_DECLINED: "intake_declined",
  RECORDING_STARTED: "recording_started",
  RECORDING_COMPLETED: "recording_completed",
  STATEMENT_SELECTED: "statement_selected",
  ADD_TO_CART: "add_to_cart",
  REMOVE_FROM_CART: "remove_from_cart",
  CHECKOUT_STARTED: "checkout_started",
  ORDER_PLACED: "order_placed",
  DELIVERABLE_VIEWED: "deliverable_viewed"
} as const;

export type EventType = (typeof EVENT)[keyof typeof EVENT];

export async function logEvent(input: {
  type: string;
  userId?: string | null;
  anonId?: string | null;
  path?: string | null;
  metadata?: Record<string, unknown>;
}) {
  try {
    await prisma.engagementEvent.create({
      data: {
        type: input.type,
        userId: input.userId ?? null,
        anonId: input.anonId ?? null,
        path: input.path ?? null,
        metadata: input.metadata ? (input.metadata as any) : undefined
      }
    });
  } catch (err) {
    // Engagement tracking must never break the feature it's instrumenting.
    console.error("logEvent failed", err);
  }
}
