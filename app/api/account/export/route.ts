import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

  const [user, orders, intakeSessions, files, threads] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        businessName: true,
        role: true,
        createdAt: true,
        plan: true,
        subscriptionStatus: true,
        planPeriodEnd: true,
        extraDiagnosticCredits: true,
        creditPurchases: { select: { quantity: true, amountCents: true, createdAt: true } }
      }
    }),
    prisma.order.findMany({
      where: { userId: session.user.id },
      include: { lines: { include: { deliverable: { select: { title: true } } } } }
    }),
    prisma.intakeSession.findMany({
      where: { userId: session.user.id },
      include: { sets: { include: { statements: true } } }
    }),
    prisma.clientFile.findMany({
      where: { userId: session.user.id },
      select: { fileName: true, mimeType: true, sizeBytes: true, createdAt: true, intakeId: true }
    }),
    prisma.clientThread.findMany({
      where: { userId: session.user.id },
      include: { messages: { select: { fromStaff: true, body: true, createdAt: true } } }
    })
  ]);

  return NextResponse.json({ exportedAt: new Date().toISOString(), user, orders, intakeSessions, files, messages: threads });
}
