import { prisma } from "@/lib/prisma";

export async function logAdminAction(input: {
  adminId: string;
  action: string;
  targetType: string;
  targetId?: string;
  metadata?: Record<string, unknown>;
}) {
  try {
    await prisma.adminAuditLog.create({
      data: {
        adminId: input.adminId,
        action: input.action,
        targetType: input.targetType,
        targetId: input.targetId,
        metadata: input.metadata as any
      }
    });
  } catch (err) {
    console.error("logAdminAction failed", err);
  }
}
