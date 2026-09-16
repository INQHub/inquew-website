-- CreateEnum
CREATE TYPE "AdminNotificationType" AS ENUM ('NEW_ORDER', 'NEW_MESSAGE');

-- AlterTable
ALTER TABLE "EngagementEvent" ADD COLUMN     "actorRole" "Role";

-- CreateTable
CREATE TABLE "AdminNotification" (
    "id" TEXT NOT NULL,
    "type" "AdminNotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "link" TEXT NOT NULL,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdminNotification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AdminNotification_read_idx" ON "AdminNotification"("read");

-- CreateIndex
CREATE INDEX "AdminNotification_createdAt_idx" ON "AdminNotification"("createdAt");

-- CreateIndex
CREATE INDEX "EngagementEvent_actorRole_idx" ON "EngagementEvent"("actorRole");

-- Backfill: snapshot each existing event's actor role from the user it belongs to,
-- so historical events logged while browsing as an authenticated admin/client are
-- retroactively distinguishable from real anonymous visitor traffic.
UPDATE "EngagementEvent" e
SET "actorRole" = u."role"
FROM "User" u
WHERE e."userId" = u."id";
