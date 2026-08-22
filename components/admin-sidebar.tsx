"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";

const NAV = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/deliverables", label: "Deliverables" },
  { href: "/admin/orders", label: "Orders" },
  { href: "/admin/intakes", label: "Intakes" },
  { href: "/admin/users", label: "Users" },
  { href: "/admin/engagement", label: "Engagement" }
];

export function AdminSidebar({ name }: { name: string }) {
  const pathname = usePathname();
  return (
    <aside className="flex min-h-screen w-[240px] flex-shrink-0 flex-col gap-[26px] bg-[#26300A] p-[24px_18px]">
      <div>
        <div className="font-display text-[23px] font-bold tracking-[0.16em] text-white">INQUEW</div>
        <div className="mt-[3px] text-[9.5px] tracking-[0.14em] text-[#B8C795]">ADMIN</div>
      </div>
      <nav className="grid gap-[5px]">
        {NAV.map((item) => {
          const active = item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-[11px] px-[14px] py-[11px] text-[14.5px] font-medium"
              style={{ background: active ? "#3E4C13" : "transparent", color: active ? "#FFFFFF" : "#C9D6A0" }}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="mt-auto grid gap-[10px] border-t border-[#3E4C13] pt-[14px]">
        <span className="truncate text-[13px] text-[#B8C795]">{name}</span>
        <Link href="/" className="text-[13px] text-[#B8C795]">
          View site
        </Link>
        <button onClick={() => signOut({ callbackUrl: "/" })} className="text-left text-[13px] text-[#B8C795]">
          Sign out
        </button>
      </div>
    </aside>
  );
}
