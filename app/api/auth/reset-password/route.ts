import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { clearResetTokens, findResetTokenUser } from "@/lib/password-reset";

const schema = z.object({ token: z.string().min(10).max(200), password: z.string().min(8).max(200) });

export async function POST(req: NextRequest) {
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Choose a password of at least 8 characters." }, { status: 400 });

  const userId = await findResetTokenUser(parsed.data.token);
  if (!userId) {
    return NextResponse.json({ error: "This reset link has expired or was already used. Request a new one." }, { status: 410 });
  }

  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash: await bcrypt.hash(parsed.data.password, 10), mustChangePassword: false }
  });
  await clearResetTokens(userId);
  return NextResponse.json({ ok: true });
}
