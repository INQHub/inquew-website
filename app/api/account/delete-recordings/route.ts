import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

  const result = await prisma.intakeSession.updateMany({
    where: { userId: session.user.id },
    data: { transcript: null, videoKey: null }
  });

  return NextResponse.json({ ok: true, cleared: result.count });
}
