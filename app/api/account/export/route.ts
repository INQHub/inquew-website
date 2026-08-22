import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

  const [user, orders, intakeSessions] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, name: true, email: true, businessName: true, role: true, createdAt: true }
    }),
    prisma.order.findMany({
      where: { userId: session.user.id },
      include: { lines: { include: { deliverable: { select: { title: true } } } } }
    }),
    prisma.intakeSession.findMany({
      where: { userId: session.user.id },
      include: { sets: { include: { statements: true } } }
    })
  ]);

  return NextResponse.json({ exportedAt: new Date().toISOString(), user, orders, intakeSessions });
}
