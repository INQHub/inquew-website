import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";
import { logAdminAction } from "@/lib/audit";
import { generateTempPassword } from "@/lib/temp-password";

const schema = z.object({
  name: z.string().min(1).max(200),
  email: z.string().email(),
  role: z.enum(["CLIENT", "ADMIN"]).default("ADMIN")
});

export async function POST(req: NextRequest) {
  const { session, response } = await requireAdmin();
  if (response) return response;

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const email = parsed.data.email.toLowerCase().trim();
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return NextResponse.json({ error: "An account with that email already exists." }, { status: 409 });

  const tempPassword = generateTempPassword();
  const user = await prisma.user.create({
    data: {
      email,
      name: parsed.data.name,
      role: parsed.data.role,
      passwordHash: await bcrypt.hash(tempPassword, 10),
      mustChangePassword: true
    }
  });

  await logAdminAction({
    adminId: session!.user.id,
    action: "create",
    targetType: "User",
    targetId: user.id,
    metadata: { email: user.email, role: user.role }
  });

  return NextResponse.json({ id: user.id, email: user.email, role: user.role, tempPassword });
}
