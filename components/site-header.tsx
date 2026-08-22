"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { useCart } from "@/components/cart-context";

const NAV = [
  { href: "/how-it-works", label: "How It Works" },
  { href: "/deliverables", label: "Deliverables" },
  { href: "/team", label: "Team" },
  { href: "/contact", label: "Contact" }
];

export function SiteHeader() {
  const pathname = usePathname();
  const { lines } = useCart();
  const { data: session } = useSession();
  const cartCount = lines.length;

  return (
    <header className="sticky top-0 z-40 border-b border-line2 bg-[rgba(253,252,249,.93)] backdrop-blur-md">
      <div className="mx-auto flex max-w-[1240px] flex-wrap items-center gap-7 px-7 py-3">
        <Link href="/" className="flex-shrink-0">
          <Image
            src="/assets/inquew-logo.png"
            alt="Inquew"
            width={262}
            height={151}
            className="h-[42px] w-auto"
            priority
          />
        </Link>
        <nav className="ml-auto flex flex-wrap gap-1">
          {NAV.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-[9px] px-[14px] py-[9px] text-[14.5px] font-medium hover:bg-[#F2EFE3] ${
                  active ? "text-green" : "text-muted"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="flex items-center gap-[10px]">
          <Link
            href={session ? "/dashboard" : "/login"}
            className="rounded-[9px] px-[14px] py-[9px] text-[14.5px] font-medium text-[#6B7A4A] hover:bg-[#F2EFE3]"
          >
            {session ? session.user?.name?.split(" ")[0] ?? "Dashboard" : "Sign in"}
          </Link>
          <Link
            href="/cart"
            title="Cart"
            className="relative flex h-[42px] w-[42px] items-center justify-center rounded-[11px] border border-line3 bg-white hover:border-green"
          >
            <span className="text-[15px] text-ink">Cart</span>
            {cartCount > 0 && (
              <span className="absolute -right-[6px] -top-[6px] flex h-5 min-w-5 items-center justify-center rounded-full bg-green px-[5px] text-[11px] font-bold text-white">
                {cartCount}
              </span>
            )}
          </Link>
          <Link
            href="/intake"
            className="rounded-[11px] bg-cyan px-[18px] py-[11px] text-[14.5px] font-semibold text-cyan-ink shadow-[0_2px_10px_rgba(19,226,233,.35)] hover:bg-cyan-hover"
          >
            Record Video
          </Link>
        </div>
      </div>
    </header>
  );
}
