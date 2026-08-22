import { prisma } from "@/lib/prisma";

export const STATUS_LABEL: Record<string, string> = {
  PENDING_PAYMENT: "Payment pending",
  PAID: "Paid",
  ASSIGNED: "Consultant creating",
  IN_REVIEW: "In review",
  AWAITING_CLIENT_REVIEW: "Awaiting your review",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled"
};

export const STATUS_STYLE: Record<string, { bg: string; fg: string }> = {
  PENDING_PAYMENT: { bg: "#F7F5EC", fg: "#8A8468" },
  PAID: { bg: "#F1F4FF", fg: "#4A5AA8" },
  ASSIGNED: { bg: "#F1F4FF", fg: "#4A5AA8" },
  IN_REVIEW: { bg: "#EFF6F2", fg: "#2D7B5F" },
  AWAITING_CLIENT_REVIEW: { bg: "#FBF7EA", fg: "#8A7B33" },
  DELIVERED: { bg: "#F2F5E6", fg: "#4F6110" },
  CANCELLED: { bg: "#FDF2F2", fg: "#A64B4B" }
};

export async function getOrdersForUser(userId: string) {
  return prisma.order.findMany({
    where: { userId },
    include: { lines: { include: { deliverable: true, files: true } } },
    orderBy: { createdAt: "desc" }
  });
}

export async function getLatestChosenStatement(userId: string) {
  const statement = await prisma.problemStatement.findFirst({
    where: { selected: true, set: { session: { userId } } },
    orderBy: { id: "desc" }
  });
  return statement?.text ?? null;
}
