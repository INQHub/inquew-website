import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { AttachVideoForm } from "@/components/admin/attach-video-form";
import { RegenerateStatementsButton } from "@/components/admin/regenerate-statements-button";

export default async function AdminIntakeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await prisma.intakeSession.findUnique({
    where: { id },
    include: { user: true, sets: { include: { statements: true }, orderBy: { generatedAt: "desc" } } }
  });
  if (!session) notFound();

  return (
    <div className="max-w-[720px]">
      <h1 className="text-[28px] font-bold">{session.user?.email ?? "Guest"}</h1>
      <p className="mt-2 text-muted">Status: {session.status}</p>

      <div className="mt-6 rounded-[20px] border border-line bg-white p-6">
        <h3 className="text-[18px] font-semibold">Transcript</h3>
        <p className="mt-3 whitespace-pre-wrap text-[14px] text-muted">{session.transcript || "No transcript on file."}</p>
        {session.videoKey && <p className="mt-3 text-[12.5px] text-faint">Video on file: {session.videoKey}</p>}
        <div className="mt-4">
          <AttachVideoForm intakeId={session.id} />
        </div>
      </div>

      <div className="mt-6 rounded-[20px] border border-line bg-white p-6">
        <div className="flex items-center justify-between">
          <h3 className="text-[18px] font-semibold">Problem statement sets</h3>
          <RegenerateStatementsButton intakeId={session.id} />
        </div>
        <div className="mt-4 grid gap-4">
          {session.sets.map((set) => (
            <div key={set.id} className="rounded-xl border border-line2 p-4">
              <div className="text-[12px] font-semibold uppercase tracking-[0.05em] text-faint">
                {set.source} · {set.generatedAt.toLocaleString("en-US")}
              </div>
              <div className="mt-2 grid gap-2">
                {set.statements.map((s) => (
                  <div key={s.id} className={`rounded-lg p-3 text-[14px] ${s.selected ? "bg-green-tint" : "bg-sand"}`}>
                    {s.selected && <span className="mr-2 text-[11px] font-bold uppercase text-green">Selected</span>}
                    {s.text}
                  </div>
                ))}
              </div>
            </div>
          ))}
          {session.sets.length === 0 && <p className="text-[14px] text-muted">No statements generated yet.</p>}
        </div>
      </div>
    </div>
  );
}
