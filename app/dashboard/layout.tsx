import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { DashboardSidebar } from "@/components/dashboard-sidebar";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login?callbackUrl=/dashboard");

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user) redirect("/login?callbackUrl=/dashboard");

  return (
    <div className="flex min-h-screen flex-wrap items-stretch">
      <DashboardSidebar name={user.name ?? "You"} businessName={user.businessName ?? user.email} />
      <main className="min-w-[320px] flex-1 bg-paper px-[34px] pb-[60px] pt-8">{children}</main>
    </div>
  );
}
