import { prisma } from "@/lib/prisma";
import type { OrderStatus } from "@prisma/client";

const PAID_STATUSES: OrderStatus[] = ["PAID", "ASSIGNED", "IN_REVIEW", "AWAITING_CLIENT_REVIEW", "DELIVERED"];
const PENDING_STATUSES: OrderStatus[] = ["ASSIGNED", "IN_REVIEW", "AWAITING_CLIENT_REVIEW"];

export async function getAdminOverviewStats() {
  const [orderCount, revenueAgg, userCount, pendingOrders] = await Promise.all([
    prisma.order.count({ where: { status: { in: PAID_STATUSES } } }),
    prisma.order.aggregate({ where: { status: { in: PAID_STATUSES } }, _sum: { subtotalCents: true } }),
    prisma.user.count({ where: { role: "CLIENT" } }),
    prisma.order.count({ where: { status: { in: PENDING_STATUSES } } })
  ]);

  return {
    orderCount,
    revenueCents: revenueAgg._sum?.subtotalCents ?? 0,
    userCount,
    pendingOrders
  };
}

export const FUNNEL_TYPES = [
  "page_view",
  "intake_started",
  "intake_consented",
  "recording_started",
  "recording_completed",
  "statement_selected",
  "add_to_cart",
  "checkout_started",
  "order_placed"
];

export async function getEventCounts(since: Date, types: string[] = FUNNEL_TYPES) {
  const rows = await prisma.engagementEvent.groupBy({
    by: ["type"],
    where: { createdAt: { gte: since }, type: { in: types } },
    _count: { _all: true }
  });
  const counts = new Map(rows.map((r) => [r.type, r._count._all]));
  return types.map((t) => ({ type: t, count: counts.get(t) ?? 0 }));
}
