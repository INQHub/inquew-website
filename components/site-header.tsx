"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { useCart } from "@/components/cart-context";

const NAV = [
  { href: "/how-it-works", label: "How It Works" },
  { href: "/pricing", label: "Pricing" },
  { href: "/deliverables", label: "Deliverables" },
  { href: "/case-studies", label: "Case Studies" },
  { href: "/privacy", label: "Privacy" }
];

export function SiteHeader() {
  const pathname = usePathname();
  const { lines } = useCart();
  const { data: session } = useSession();
  const cartCount = lines.length;

  return (
    <header className="sticky top-0 z-40 bg-forest">
      <div className="mx-auto flex max-w-[1240px] flex-wrap items-center gap-x-6 gap-y-3 px-6 py-3">
        <Link href="/" className="flex flex-shrink-0 items-center gap-3 text-white hover:text-white" aria-label="Inquew home">
          <img src="/assets/feather-white.png" alt="" className="h-[28px] w-auto" />
          <span className="font-display text-[21px] font-extrabold tracking-[0.18em]">INQUEW</span>
        </Link>
        <nav aria-label="Main" className="ml-auto flex flex-wrap gap-1">
          {NAV.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`rounded-[9px] px-3 py-[9px] text-[14.5px] font-medium hover:bg-white/10 hover:text-white ${
                  active ? "text-white underline underline-offset-[6px]" : "text-[#DCE8E0]"
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
            className="rounded-[9px] px-3 py-[9px] text-[14.5px] font-medium text-[#DCE8E0] hover:bg-white/10 hover:text-white"
          >
            {session ? session.user?.name?.split(" ")[0] ?? "Dashboard" : "Sign in"}
          </Link>
          <Link
            href="/cart"
            aria-label={`Cart${cartCount ? `, ${cartCount} items` : ""}`}
            className="relative flex h-[42px] items-center justify-center rounded-[11px] border border-white/30 px-3 text-[14.5px] text-white hover:border-white hover:text-white"
          >
            Cart
            {cartCount > 0 && (
              <span className="absolute -right-[6px] -top-[6px] flex h-5 min-w-5 items-center justify-center rounded-full bg-sky px-[5px] text-[11px] font-bold text-forest">
                {cartCount}
              </span>
            )}
          </Link>
          <Link
            href="/intake"
            className="rounded-full bg-sky px-[18px] py-[11px] text-[14.5px] font-semibold text-forest hover:bg-aqua hover:text-forest"
          >
            Start free diagnostic
          </Link>
        </div>
      </div>
    </header>
  );
}
