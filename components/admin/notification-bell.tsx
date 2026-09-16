"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export function NotificationBell() {
  const pathname = usePathname();
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function poll() {
      try {
        const res = await fetch("/api/admin/notifications/unread-count");
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled) setCount(data.count);
      } catch {
        // Polling failure just leaves the last known count showing.
      }
    }
    poll();
    const interval = setInterval(poll, 45_000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [pathname]);

  const active = pathname.startsWith("/admin/notifications");

  return (
    <Link
      href="/admin/notifications"
      className="relative flex items-center gap-[10px] rounded-[11px] px-[14px] py-[11px] text-[14.5px] font-medium"
      style={{ background: active ? "#3E4C13" : "transparent", color: active ? "#FFFFFF" : "#C9D6A0" }}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
      </svg>
      Notifications
      {!!count && (
        <span className="ml-auto flex h-[20px] min-w-[20px] items-center justify-center rounded-full bg-cyan px-[6px] text-[11px] font-bold text-cyan-ink">
          {count > 99 ? "99+" : count}
        </span>
      )}
    </Link>
  );
}
