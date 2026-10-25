import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { FileUploader } from "@/components/portal/file-uploader";
import { FileActions } from "@/components/portal/file-actions";
import { LockIcon } from "@/components/diagnostic/flow-parts";
import { ACCEPT_ATTR, formatBytes } from "@/lib/uploads";
import { problemCode } from "@/lib/diagnostic";
import { getDiagnosesForUser } from "@/lib/queries/diagnoses";

export default async function FilesPage() {
  const session = await auth();
  const userId = session!.user.id;
  const [files, diagnoses] = await Promise.all([
    prisma.clientFile.findMany({ where: { userId }, orderBy: { createdAt: "desc" } }),
    getDiagnosesForUser(userId)
  ]);
  const problemSpaces = diagnoses.map((d) => ({
    id: d.id,
    label: `${problemCode(d.id)} · ${d.statement.length > 60 ? d.statement.slice(0, 60) + "…" : d.statement}`
  }));
  const labelFor = new Map(problemSpaces.map((p) => [p.id, problemCode(p.id)]));

  return (
    <div className="grid max-w-[1040px] gap-6">
      <div className="flex flex-wrap items-center gap-4">
        <img src="/assets/mascots/document.png" alt="" className="h-[56px] w-auto" />
        <div>
          <h1 className="text-[32px] font-bold">Your files</h1>
          <p className="text-muted">Documents you share become part of your business library, so every deliverable fits your business.</p>
        </div>
      </div>

      <div className="flex flex-wrap items-stretch gap-6">
        <div className="min-w-0 flex-[999_1_420px]">
          <FileUploader accept={ACCEPT_ATTR} problemSpaces={problemSpaces} />
        </div>
        <aside className="grid min-w-0 flex-[1_1_280px] content-start gap-4">
          <div className="rounded-2xl bg-olive-tint p-5">
            <strong className="text-olive">Before you upload</strong>
            <p className="mt-1 text-[14px] text-[#36423B]">
              Black out sensitive details first. Don&apos;t upload financial statements, Social Security or driver&apos;s
              license numbers, bank details, API keys or trade secrets.
            </p>
          </div>
          <div className="flex gap-3 rounded-2xl border border-line bg-white p-5 text-[14px] text-[#36423B]">
            <LockIcon />
            <span>
              Encrypted in transit and at rest. Only you and the Inquew team working on your request can open your files,
              and they&apos;re never shared with competitors.
            </span>
          </div>
        </aside>
      </div>

      <section aria-labelledby="all-files" className="rounded-[20px] border border-line bg-white p-6">
        <h2 id="all-files" className="text-[19px] font-bold">
          All files ({files.length})
        </h2>
        {files.length === 0 ? (
          <p className="mt-3 text-muted">No files yet.</p>
        ) : (
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[640px] border-collapse text-[15px]">
              <thead>
                <tr className="text-left text-[13px] text-muted">
                  <th className="border-b border-line px-2 py-2 font-semibold">Name</th>
                  <th className="border-b border-line px-2 py-2 font-semibold">Problem space</th>
                  <th className="border-b border-line px-2 py-2 font-semibold">Uploaded</th>
                  <th className="border-b border-line px-2 py-2 font-semibold">Size</th>
                  <th className="border-b border-line px-2 py-2 font-semibold">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {files.map((f) => (
                  <tr key={f.id}>
                    <td className="border-b border-line px-2 py-3 font-semibold text-forest">{f.fileName}</td>
                    <td className="border-b border-line px-2 py-3">{(f.intakeId && labelFor.get(f.intakeId)) || "General"}</td>
                    <td className="border-b border-line px-2 py-3">
                      {f.createdAt.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </td>
                    <td className="border-b border-line px-2 py-3">{formatBytes(f.sizeBytes)}</td>
                    <td className="border-b border-line px-2 py-3">
                      <FileActions fileId={f.id} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <p className="mt-3 text-[13px] text-faint">Download links expire after 10 minutes. Delivered work is under Downloads.</p>
      </section>
    </div>
  );
}
