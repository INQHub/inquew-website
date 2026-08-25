-- AlterTable
ALTER TABLE "ContactMessage" ADD COLUMN     "handled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "handledAt" TIMESTAMP(3);
