"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";

const NAV = [
  { href: "/dashboard", label: "Overview" },
  { href: "/dashboard/diagnoses", label: "Diagnoses" },
  { href: "/dashboard/messages", label: "Messages" },
  { href: "/dashboard/files", label: "Your files" },
  { href: "/dashboard/downloads", label: "Downloads" },
  { href: "/dashboard/orders", label: "Purchase history" },
  { href: "/dashboard/billing", label: "Plan & billing" },
  { href: "/dashboard/account", label: "Settings" }
];

type Meter = { plan: string; line: string; used: number; allowance: number };

export function DashboardSidebar({
  name,
  businessName,
  unread = 0,
  meter = null
}: {
  name: string;
  businessName: string;
  unread?: number;
  meter?: Meter | null;
}) {
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
        <div className="flex items-center gap-[10px]">
          <img src="/assets/feather-white.png" alt="" className="h-[22px] w-auto" />
          <span className="font-display text-[20px] font-extrabold tracking-[0.16em] text-white">INQUEW</span>
        </div>
        <div className="mt-[3px] text-[9.5px] tracking-[0.14em] text-[#C4D6CA]">CLIENT DASHBOARD</div>
      </div>
      <nav className="grid gap-[5px]">
        {NAV.map((item) => {
          const active = item.href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-[11px] px-[14px] py-[11px] text-[14.5px] font-medium"
              style={{ background: active ? "#2D7B5F" : "transparent", color: active ? "#FFFFFF" : "#DCE8E0" }}
            >
              {item.label}
              {item.href === "/dashboard/messages" && unread > 0 && (
                <span className="ml-2 rounded-full bg-sky px-2 text-[12px] font-bold text-forest">{unread}</span>
              )}
            </Link>
          );
        })}
      </nav>
      <div className="mt-auto grid gap-[14px]">
        {meter && (
          <Link href="/dashboard/billing" className="grid gap-2 rounded-[11px] bg-[#1E5225] px-[14px] py-3 text-white hover:text-white">
            <span className="text-[12px] font-bold uppercase tracking-[0.08em] text-[#C4D6CA]">{meter.plan}</span>
            <span className="h-[6px] overflow-hidden rounded-full bg-[#2F6B3A]">
              <span
                className="block h-full rounded-full bg-sky"
                style={{ width: `${meter.allowance ? Math.min(100, Math.round((meter.used / meter.allowance) * 100)) : 0}%` }}
              />
            </span>
            <span className="text-[12.5px] text-[#DCE8E0]">{meter.line}</span>
          </Link>
        )}
        <Link href="/intake" className="rounded-[11px] bg-cyan px-[14px] py-3 text-center text-[14px] font-semibold text-cyan-ink">
          Work on a new problem
        </Link>
        <Link href="/deliverables" className="rounded-[11px] border border-[#4F7A5E] px-[14px] py-3 text-center text-[14px] font-semibold text-white hover:text-white">
          Buy a deliverable
        </Link>
        <div className="flex items-center gap-[11px] border-t border-[#2D7B5F] pt-[14px]">
          <div className="flex h-[34px] w-[34px] items-center justify-center rounded-full bg-olive text-[13px] font-bold text-white">
            {initials || "?"}
          </div>
          <div className="min-w-0">
            <div className="truncate text-[13.5px] font-semibold text-[#F3F5E8]">{name}</div>
            <div className="truncate text-[11.5px] text-[#C4D6CA]">{businessName}</div>
          </div>
        </div>
        <button onClick={() => signOut({ callbackUrl: "/" })} className="text-left text-[13px] text-[#C4D6CA]">
          Sign out
        </button>
      </div>
    </aside>
  );
}
