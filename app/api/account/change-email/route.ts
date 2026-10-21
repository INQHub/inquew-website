import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  currentPassword: z.string().min(1),
  newEmail: z.string().email()
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });

  const newEmail = parsed.data.newEmail.toLowerCase().trim();

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user?.passwordHash) return NextResponse.json({ error: "No password set on this account." }, { status: 400 });

  const valid = await bcrypt.compare(parsed.data.currentPassword, user.passwordHash);
  if (!valid) return NextResponse.json({ error: "Current password is incorrect." }, { status: 400 });

  if (newEmail === user.email) return NextResponse.json({ ok: true, email: newEmail });

  const existing = await prisma.user.findUnique({ where: { email: newEmail } });
  if (existing) return NextResponse.json({ error: "An account with that email already exists." }, { status: 409 });

  await prisma.user.update({ where: { id: user.id }, data: { email: newEmail } });

  return NextResponse.json({ ok: true, email: newEmail });
}
