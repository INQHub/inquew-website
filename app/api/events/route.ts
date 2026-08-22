import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { logEvent } from "@/lib/events";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body?.type) return NextResponse.json({ error: "type is required" }, { status: 400 });

  const session = await auth();
  await logEvent({
    type: body.type,
    userId: session?.user?.id ?? null,
    anonId: body.anonId ?? null,
    path: body.path ?? null,
    metadata: body.metadata
  });

  return NextResponse.json({ ok: true });
}
