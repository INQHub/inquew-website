import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/require-admin";
import { getUnreadNotificationCount } from "@/lib/notifications";

export async function GET() {
  const { response } = await requireAdmin();
  if (response) return response;

  const count = await getUnreadNotificationCount();
  return NextResponse.json({ count });
}
