import { createHash, randomBytes } from "node:crypto";
import { prisma } from "@/lib/prisma";

// Reset links live in the NextAuth VerificationToken table under this prefix. Only a SHA-256
// hash of the token is stored, so a database leak can't be used to reset anyone's password.
const PREFIX = "password-reset:";
export const RESET_TTL_MINUTES = 60;
// Don't send another email if one went out in the last couple of minutes (double clicks, abuse).
const RESEND_COOLDOWN_MS = 2 * 60_000;

function hashToken(raw: string) {
  return createHash("sha256").update(raw).digest("hex");
}

/**
 * Where reset links point. On a Vercel preview it's that preview (its own system env var,
 * not the request's Host header, so a forged Host can't redirect the link); otherwise the
 * configured site URL.
 */
export function resetBaseUrl() {
  if (process.env.VERCEL_ENV === "preview") {
    const host = process.env.VERCEL_BRANCH_URL ?? process.env.VERCEL_URL;
    if (host) return `https://${host}`;
  }
  return (process.env.NEXTAUTH_URL ?? "http://localhost:3000").replace(/\/$/, "");
}

/** Returns a new raw token for this user, or null if one was issued moments ago. */
export async function issueResetToken(userId: string): Promise<string | null> {
  const identifier = PREFIX + userId;
  const recent = await prisma.verificationToken.findFirst({
    where: { identifier, expires: { gt: new Date(Date.now() + RESET_TTL_MINUTES * 60_000 - RESEND_COOLDOWN_MS) } }
  });
  if (recent) return null;

  const raw = randomBytes(32).toString("base64url");
  await prisma.$transaction([
    prisma.verificationToken.deleteMany({ where: { identifier } }),
    prisma.verificationToken.create({
      data: { identifier, token: hashToken(raw), expires: new Date(Date.now() + RESET_TTL_MINUTES * 60_000) }
    })
  ]);
  return raw;
}

/** The user a still-valid reset token belongs to, or null. */
export async function findResetTokenUser(raw: string): Promise<string | null> {
  const row = await prisma.verificationToken.findUnique({ where: { token: hashToken(raw) } });
  if (!row || !row.identifier.startsWith(PREFIX) || row.expires < new Date()) return null;
  return row.identifier.slice(PREFIX.length);
}

/** Uses up every outstanding reset link for the user (after a successful reset). */
export async function clearResetTokens(userId: string) {
  await prisma.verificationToken.deleteMany({ where: { identifier: PREFIX + userId } });
}
