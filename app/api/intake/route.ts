import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { getPlanUsage, quotaErrorBody } from "@/lib/subscriptions";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const session = await auth();

  // A signed-in client with nothing left on their plan is stopped before recording, not after.
  // Anonymous visitors are checked when they finish, once they've signed in.
  if (body.consent && session?.user?.id) {
    const usage = await getPlanUsage(session.user.id);
    if (usage && usage.remaining <= 0) return NextResponse.json(quotaErrorBody(usage), { status: 402 });
  }

  const intake = await prisma.intakeSession.create({
    data: {
      userId: session?.user?.id ?? null,
      status: body.consent ? "RECORDING" : "DECLINED",
      consentAt: body.consent ? new Date() : null,
      declinedAt: body.consent ? null : new Date()
    }
  });

  return NextResponse.json({ id: intake.id, status: intake.status });
}
