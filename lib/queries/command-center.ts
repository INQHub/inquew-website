import { prisma } from "@/lib/prisma";
import type { OrderStatus } from "@prisma/client";

const PAID: OrderStatus[] = ["PAID", "ASSIGNED", "IN_REVIEW", "AWAITING_CLIENT_REVIEW", "DELIVERED"];
const OPEN: OrderStatus[] = ["PAID", "ASSIGNED", "IN_REVIEW", "AWAITING_CLIENT_REVIEW"];

/** Days since an order was placed before it shows as "At risk" / "Overdue" in the queue. */
export const AT_RISK_DAYS = 4;
export const OVERDUE_DAYS = 7;

const DAY = 86_400_000;

export function queueHealth(createdAt: Date, now = Date.now()) {
  const days = Math.floor((now - createdAt.getTime()) / DAY);
  if (days >= OVERDUE_DAYS) return { label: "Overdue", bg: "#FBE3E3", fg: "#8A1F1F", days };
  if (days >= AT_RISK_DAYS) return { label: "At risk", bg: "#FFF1D6", fg: "#7A4B00", days };
  return { label: "On track", bg: "#EAF3EE", fg: "#14401A", days };
}

export async function getCommandCenter() {
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * DAY);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const [ordersThisWeek, revenueMonth, byStatus, deliveredThisWeek, clients, unreadThreads, queue, diagnoses, messages, orders] =
    await Promise.all([
      prisma.order.count({ where: { status: { in: PAID }, createdAt: { gte: weekAgo } } }),
      prisma.order.aggregate({ where: { status: { in: PAID }, createdAt: { gte: monthStart } }, _sum: { subtotalCents: true } }),
      prisma.order.groupBy({ by: ["status"], where: { status: { in: OPEN } }, _count: { _all: true } }),
      prisma.order.count({ where: { status: "DELIVERED", updatedAt: { gte: weekAgo } } }),
      prisma.user.count({ where: { role: "CLIENT" } }),
      prisma.clientThread.count({ where: { staffUnread: true } }),
      prisma.order.findMany({
        where: { status: { in: OPEN } },
        orderBy: { createdAt: "asc" },
        take: 25,
        include: {
          user: { select: { id: true, name: true, email: true, businessName: true } },
          lines: { include: { deliverable: { select: { title: true, tier: true } }, completedBy: { select: { name: true } } } }
        }
      }),
      prisma.intakeSession.findMany({
        where: { diagnosedAt: { not: null } },
        orderBy: { diagnosedAt: "desc" },
        take: 5,
        include: { user: { select: { id: true, name: true, email: true } } }
      }),
      prisma.clientMessage.findMany({
        where: { fromStaff: false },
        orderBy: { createdAt: "desc" },
        take: 5,
        include: { thread: { include: { user: { select: { name: true, email: true } } } } }
      }),
      prisma.order.findMany({
        where: { status: { in: PAID } },
        orderBy: { createdAt: "desc" },
        take: 5,
        include: { user: { select: { name: true, email: true } } }
      })
    ]);

  const plans = await prisma.user.groupBy({ by: ["plan"], where: { role: "CLIENT", plan: { in: ["PRO", "PREMIUM"] } }, _count: { _all: true } });
  const planCount = (p: "PRO" | "PREMIUM") => plans.find((x) => x.plan === p)?._count._all ?? 0;

  const count = (s: OrderStatus) => byStatus.find((b) => b.status === s)?._count._all ?? 0;

  const activity = [
    ...diagnoses.map((d) => ({
      at: d.diagnosedAt!,
      text: `New diagnosis · ${d.user?.name ?? d.user?.email ?? "Client"}`,
      href: d.user ? `/admin/clients/${d.user.id}` : `/admin/intakes/${d.id}`
    })),
    ...messages.map((m) => ({
      at: m.createdAt,
      text: `Client message · ${m.thread.user.name ?? m.thread.user.email} · ${m.thread.subject}`,
      href: `/admin/client-messages/${m.threadId}`
    })),
    ...orders.map((o) => ({
      at: o.createdAt,
      text: `Order ${o.displayId} · ${o.user.name ?? o.user.email}`,
      href: `/admin/orders/${o.id}`
    }))
  ]
    .sort((a, b) => b.at.getTime() - a.at.getTime())
    .slice(0, 8);

  return {
    kpis: {
      ordersThisWeek,
      revenueMonthCents: revenueMonth._sum.subtotalCents ?? 0,
      inProgress: count("ASSIGNED") + count("IN_REVIEW") + count("AWAITING_CLIENT_REVIEW"),
      queued: count("PAID"),
      clients,
      unreadThreads,
      pro: planCount("PRO"),
      premium: planCount("PREMIUM")
    },
    pipeline: [
      { label: "Queued", n: count("PAID"), href: "/admin/orders" },
      { label: "AI agents building", n: count("ASSIGNED"), href: "/admin/orders" },
      { label: "Consultant QA", n: count("IN_REVIEW"), href: "/admin/orders" },
      { label: "Awaiting client", n: count("AWAITING_CLIENT_REVIEW"), href: "/admin/orders" },
      { label: "Completed this week", n: deliveredThisWeek, href: "/admin/orders" }
    ],
    queue,
    activity
  };
}
