import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const session = await auth();

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
