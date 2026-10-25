import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { escapeHtml } from "@/lib/notifications";
import { sendEmail } from "@/lib/email";
import { issueResetToken, resetBaseUrl, RESET_TTL_MINUTES } from "@/lib/password-reset";

const schema = z.object({ email: z.string().email().max(320) });

// Same reply whether or not the account exists, so this can't be used to discover who has one.
const GENERIC = { ok: true };

export async function POST(req: NextRequest) {
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });

  const email = parsed.data.email.toLowerCase().trim();
  const user = await prisma.user.findUnique({ where: { email }, select: { id: true, name: true, active: true, passwordHash: true } });
  if (!user || !user.active || !user.passwordHash) return NextResponse.json(GENERIC);

  const token = await issueResetToken(user.id);
  if (!token) return NextResponse.json(GENERIC);

  const link = `${resetBaseUrl()}/reset-password?token=${encodeURIComponent(token)}`;
  await sendEmail({
    to: email,
    subject: "Reset your Inquew password",
    html: `<p>Hi ${user.name ? escapeHtml(user.name.split(" ")[0]) : "there"},</p>
<p>Someone asked to reset the password for your Inquew account. To choose a new password, open this link:</p>
<p><a href="${link}">Reset my password</a></p>
<p>The link works once and expires in ${RESET_TTL_MINUTES} minutes. If you didn't ask for this, you can ignore this email and your password won't change.</p>`
  });

  return NextResponse.json(GENERIC);
}
