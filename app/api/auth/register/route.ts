import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  name: z.string().min(1).max(200),
  email: z.string().email(),
  password: z.string().min(8).max(200),
  businessName: z.string().max(200).optional()
});

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Enter a name, valid email, and a password of at least 8 characters." }, { status: 400 });
  }
  const email = parsed.data.email.toLowerCase().trim();

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: "An account with that email already exists." }, { status: 409 });
  }

  await prisma.user.create({
    data: {
      email,
      name: parsed.data.name,
      businessName: parsed.data.businessName,
      role: "CLIENT",
      passwordHash: await bcrypt.hash(parsed.data.password, 10)
    }
  });

  return NextResponse.json({ ok: true });
}
