import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { DownloadButton } from "@/components/download-button";

function formatBytes(n: number | null) {
  if (!n) return "";
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${Math.round(n / 1024)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

export default async function DashboardDownloadsPage() {
  const session = await auth();
  const files = await prisma.deliverableFile.findMany({
    where: { orderLine: { order: { userId: session!.user.id } } },
    include: { orderLine: { include: { deliverable: true } } },
    orderBy: { createdAt: "desc" }
  });

  return (
    <div>
      <h1 className="text-[32px] font-bold">Downloads</h1>
      <p className="mt-2 text-muted">Delivered files, posted to your account. Links expire and can be reissued.</p>

      <div className="mt-6 grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-[18px]">
        {files.length === 0 && <p className="text-[14px] text-muted">Nothing delivered yet.</p>}
        {files.map((f) => {
          const ext = f.fileName.split(".").pop()?.toUpperCase() ?? "FILE";
          return (
            <div key={f.id} className="rounded-[18px] border border-line bg-white p-5">
              <div className="flex items-start justify-between gap-[10px]">
                <div className="rounded-[7px] border border-line2 bg-sand px-2 py-1 font-mono text-[11px] text-faint">{ext}</div>
                <span className="text-[12px] text-faint">{formatBytes(f.sizeBytes)}</span>
              </div>
              <h3 className="mt-[14px] text-[16.5px] font-semibold">{f.fileName}</h3>
              <p className="mt-1 text-[12.5px] text-faint">
                Delivered {f.createdAt.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
              </p>
              <div className="mt-4">
                <DownloadButton fileId={f.id} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
