import { prisma } from "@/lib/prisma";
import { NotificationRowControls, MarkAllReadButton } from "@/components/admin/notification-controls";

const TYPE_LABEL: Record<string, string> = {
  NEW_ORDER: "Order",
  NEW_MESSAGE: "Message"
};

export default async function AdminNotificationsPage({
  searchParams
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  const sp = await searchParams;
  const filter = sp.filter === "read" ? "read" : sp.filter === "all" ? "all" : "unread";

  const [notifications, unreadCount, totalCount] = await Promise.all([
    prisma.adminNotification.findMany({
      where: filter === "all" ? undefined : { read: filter === "read" },
      orderBy: { createdAt: "desc" },
      take: 100
    }),
    prisma.adminNotification.count({ where: { read: false } }),
    prisma.adminNotification.count()
  ]);

  const tabs = [
    { key: "unread", label: "Unread", count: unreadCount },
    { key: "read", label: "Read", count: totalCount - unreadCount },
    { key: "all", label: "All", count: totalCount }
  ];

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-[32px] font-bold">Notifications</h1>
          <p className="mt-2 text-muted">New orders and contact messages, as they come in.</p>
        </div>
        <div className="flex items-center gap-2">
          {tabs.map((tab) => (
            <a
              key={tab.key}
              href={`/admin/notifications?filter=${tab.key}`}
              className="rounded-full border border-line3 px-4 py-2 text-[13px] font-semibold"
              style={{
                background: filter === tab.key ? "#26300A" : "transparent",
                color: filter === tab.key ? "#FFFFFF" : "inherit"
              }}
            >
              {tab.label} ({tab.count})
            </a>
          ))}
          {unreadCount > 0 && <MarkAllReadButton />}
        </div>
      </div>

      {notifications.length === 0 ? (
        <p className="mt-8 text-muted">Nothing here.</p>
      ) : (
        <div className="mt-6 grid gap-3">
          {notifications.map((n) => (
            <div key={n.id} className="rounded-[20px] border border-line bg-white p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span
                      className="rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide"
                      style={{ background: n.type === "NEW_ORDER" ? "#EAF1DD" : "#EFEDE2", color: "#425206" }}
                    >
                      {TYPE_LABEL[n.type] ?? n.type}
                    </span>
                    <span className="font-semibold">{n.title}</span>
                  </div>
                  <div className="mt-1 text-[12.5px] text-faint">
                    {new Date(n.createdAt).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <a href={n.link} className="rounded-lg border border-line3 px-3 py-1.5 text-[13px] font-semibold">
                    View
                  </a>
                  <NotificationRowControls notificationId={n.id} read={n.read} />
                </div>
              </div>
              <p className="mt-3 whitespace-pre-wrap text-[14.5px] leading-relaxed">{n.body}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
