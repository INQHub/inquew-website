"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { NotificationBell } from "@/components/admin/notification-bell";

const NAV = [
  { href: "/admin", label: "Command center" },
  { href: "/admin/orders", label: "Orders" },
  { href: "/admin/clients", label: "Clients" },
  { href: "/admin/client-messages", label: "Client messages", badge: true },
  { href: "/admin/intakes", label: "Intakes" },
  { href: "/admin/deliverables", label: "Deliverables" },
  { href: "/admin/case-studies", label: "Case studies" },
  { href: "/admin/engagement", label: "Engagement" },
  { href: "/admin/messages", label: "Contact form" },
  { href: "/admin/users", label: "Users" },
  { href: "/admin/account", label: "Account" }
];

export function AdminSidebar({ name, unreadClientMessages = 0 }: { name: string; unreadClientMessages?: number }) {
  const pathname = usePathname();
  return (
    <aside className="flex min-h-screen w-[240px] flex-shrink-0 flex-col gap-[26px] bg-[#26300A] p-[24px_18px]">
      <div>
        <div className="font-display text-[23px] font-bold tracking-[0.16em] text-white">INQUEW</div>
        <div className="mt-[3px] text-[9.5px] tracking-[0.14em] text-[#C4D6CA]">ADMIN</div>
      </div>
      <nav className="grid gap-[5px]">
        <NotificationBell />
        {NAV.map((item) => {
          const active = item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center justify-between gap-2 rounded-[11px] px-[14px] py-[11px] text-[14.5px] font-medium"
              style={{ background: active ? "#3E4C13" : "transparent", color: active ? "#FFFFFF" : "#DCE8E0" }}
            >
              {item.label}
              {"badge" in item && unreadClientMessages > 0 && (
                <span className="rounded-full bg-sky px-[8px] py-[1px] text-[12px] font-bold text-forest" aria-label={`${unreadClientMessages} unread`}>
                  {unreadClientMessages}
                </span>
              )}
            </Link>
          );
        })}
      </nav>
      <div className="mt-auto grid gap-[10px] border-t border-[#3E4C13] pt-[14px]">
        <span className="truncate text-[13px] text-[#C4D6CA]">{name}</span>
        <Link href="/" className="text-[13px] text-[#C4D6CA]">
          View site
        </Link>
        <button onClick={() => signOut({ callbackUrl: "/" })} className="text-left text-[13px] text-[#C4D6CA]">
          Sign out
        </button>
      </div>
    </aside>
  );
}
