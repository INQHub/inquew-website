import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { AdminSidebar } from "@/components/admin-sidebar";
import { getStaffUnreadThreadCount } from "@/lib/messages";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") redirect("/login?callbackUrl=/admin");

  const unread = await getStaffUnreadThreadCount().catch(() => 0);

  return (
    <div className="flex min-h-screen flex-wrap items-stretch bg-paper">
      <AdminSidebar name={session.user.email ?? "Admin"} unreadClientMessages={unread} />
      <main className="min-w-[320px] flex-1 px-[34px] pb-[60px] pt-8">{children}</main>
    </div>
  );
}
