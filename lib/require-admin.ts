import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export async function requireAdmin() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return { session: null, response: NextResponse.json({ error: "Admin access required" }, { status: 403 }) };
  }
  return { session, response: null };
}
