import Link from "next/link";
import { auth } from "@/lib/auth";
import { getDiagnosesForUser } from "@/lib/queries/diagnoses";
import { problemCode } from "@/lib/diagnostic";

export default async function DiagnosesPage() {
  const session = await auth();
  const diagnoses = await getDiagnosesForUser(session!.user.id);

  return (
    <div className="max-w-[860px]">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-[32px] font-bold">Diagnoses</h1>
        <Link href="/intake" className="rounded-full bg-cyan px-5 py-3 font-semibold text-cyan-ink">
          Start a new diagnostic
        </Link>
      </div>

      {diagnoses.length === 0 ? (
        <div className="mt-6 flex flex-wrap items-center gap-6 rounded-[20px] border border-line bg-white p-8">
          <img src="/assets/mascots/question.png" alt="" className="h-[80px] w-auto" />
          <div className="min-w-0 flex-[1_1_300px]">
            <h2 className="text-[20px] font-extrabold">No diagnoses yet</h2>
            <p className="mt-1 text-muted">Record a two-minute video and Inquew will diagnose the problem with you.</p>
          </div>
        </div>
      ) : (
        <div className="mt-6 grid gap-4">
          {diagnoses.map((d) => (
            <Link
              key={d.id}
              href={`/diagnosis/${d.id}`}
              className="rounded-[18px] border border-line bg-white p-5 text-ink hover:border-green-border hover:text-ink"
            >
              <div className="text-[13px] text-muted">
                {d.diagnosedAt.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })} ·{" "}
                {problemCode(d.id)}
              </div>
              <div className="mt-1 font-display text-[17px] font-semibold text-forest">{d.statement}</div>
              <div className="mt-2 text-[14px] font-semibold text-green">View results</div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
