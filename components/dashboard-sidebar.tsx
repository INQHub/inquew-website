"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";

const NAV = [
  { href: "/dashboard", label: "Overview" },
  { href: "/dashboard/orders", label: "Orders" },
  { href: "/dashboard/downloads", label: "Downloads" },
  { href: "/dashboard/account", label: "Account" }
];

export function DashboardSidebar({ name, businessName }: { name: string; businessName: string }) {
  const pathname = usePathname();
  const initials = name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <aside className="flex min-h-screen w-[250px] flex-shrink-0 flex-col gap-[26px] bg-forest p-[24px_18px]">
      <div>
        <div className="font-display text-[23px] font-bold tracking-[0.16em] text-white">INQUEW</div>
        <div className="mt-[3px] text-[9.5px] tracking-[0.14em] text-[#B8C795]">CLIENT DASHBOARD</div>
      </div>
      <nav className="grid gap-[5px]">
        {NAV.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-[11px] px-[14px] py-[11px] text-[14.5px] font-medium"
              style={{ background: active ? "#5A6B22" : "transparent", color: active ? "#FFFFFF" : "#C9D6A0" }}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="mt-auto grid gap-[14px]">
        <Link href="/deliverables" className="rounded-[11px] bg-cyan px-[14px] py-3 text-[14px] font-semibold text-cyan-ink">
          Buy a deliverable
        </Link>
        <div className="flex items-center gap-[11px] border-t border-[#5A6B22] pt-[14px]">
          <div className="flex h-[34px] w-[34px] items-center justify-center rounded-full bg-olive text-[13px] font-bold text-white">
            {initials || "?"}
          </div>
          <div className="min-w-0">
            <div className="truncate text-[13.5px] font-semibold text-[#F3F5E8]">{name}</div>
            <div className="truncate text-[11.5px] text-[#B8C795]">{businessName}</div>
          </div>
        </div>
        <button onClick={() => signOut({ callbackUrl: "/" })} className="text-left text-[13px] text-[#B8C795]">
          Sign out
        </button>
      </div>
    </aside>
  );
}
