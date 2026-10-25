import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getDiagnosis, getPendingDiagnosis } from "@/lib/queries/diagnoses";
import { getPlanUsage } from "@/lib/subscriptions";
import { QuotaPrompt } from "@/components/plan/quota-prompt";
import { FinishDiagnosisButton } from "@/components/plan/finish-diagnosis-button";
import { getDeliverablesBySlugs } from "@/lib/queries/deliverables";
import { problemCode, readQA } from "@/lib/diagnostic";
import { DeliverableCard } from "@/components/deliverable-card";

export const metadata = { title: "Your diagnosis — Inquew" };

export default async function DiagnosisPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) redirect(`/login?callbackUrl=${encodeURIComponent(`/diagnosis/${id}`)}`);

  const result = await getDiagnosis(id);
  if (!result) {
    const pending = await getPendingDiagnosis(id);
    if (!pending || (pending.intake.userId !== session.user.id && session.user.role !== "ADMIN")) notFound();
    return <PendingDiagnosis id={id} statement={pending.statement} ownerId={pending.intake.userId!} />;
  }
  const { intake, statement } = result;
  if (intake.userId !== session.user.id && session.user.role !== "ADMIN") notFound();

  const recommended = await getDeliverablesBySlugs(intake.recommendedSlugs);
  const qa = readQA(intake.diagnosticAnswers);
  const paragraphs = (intake.diagnosisSummary ?? "").split(/\n\s*\n/).filter((p) => p.trim());
  const date = intake.diagnosedAt!.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

  return (
    <div className="bg-sand">
      <div className="mx-auto grid max-w-[1120px] gap-8 px-6 pb-20 pt-10">
        <section className="flex flex-wrap items-center gap-8 rounded-3xl bg-forest p-9 text-white">
          <div className="min-w-0 flex-[1_1_520px]">
            <span className="text-[14px] text-[#C4D6CA]">
              Diagnosed {date} · Problem space {problemCode(intake.id)}
            </span>
            <h1 className="mt-3 text-[32px] font-extrabold leading-[1.2] text-white">{statement}</h1>
          </div>
          <div className="flex h-[140px] w-[140px] flex-shrink-0 items-center justify-center rounded-full bg-white">
            <img src="/assets/mascots/document.png" alt="" className="h-[86px] w-auto" />
          </div>
        </section>

        <div className="flex flex-wrap items-start gap-8">
          <div className="grid min-w-0 flex-[999_1_600px] gap-8">
            <section className="grid gap-4 rounded-[20px] border border-line bg-white p-8">
              <h2 className="text-[24px] font-extrabold">What Inquew found</h2>
              {paragraphs.map((p, i) => (
                <p key={i} className="text-[16.5px] leading-[1.65] text-[#36423B]">
                  {p}
                </p>
              ))}
              <p className="text-[13.5px] text-muted">
                Written by AI from your video and answers. Treat it as a starting point; every deliverable you buy is
                quality-checked by a consultant.
              </p>
            </section>

            <section className="grid gap-4">
              <h2 className="text-[24px] font-extrabold">Recommended next steps</h2>
              <div className="grid grid-cols-[repeat(auto-fill,minmax(250px,1fr))] gap-4">
                {recommended.map((item, i) => (
                  <div key={item.id} className={`relative ${i === 0 ? "rounded-[20px] ring-2 ring-green" : ""}`}>
                    {i === 0 && (
                      <span className="absolute -top-3 left-4 z-10 rounded-full bg-green px-3 py-1 text-[12px] font-bold tracking-[0.06em] text-white">
                        START HERE
                      </span>
                    )}
                    <DeliverableCard item={item} variant="teaser" />
                  </div>
                ))}
              </div>
              <p className="text-[14px] text-muted">
                Every deliverable is built by Inquew&apos;s AI agents and quality-checked by a consultant before delivery.{" "}
                <Link href="/deliverables">See all deliverables</Link>
              </p>
            </section>

            <section className="rounded-[20px] border border-line bg-white px-6 py-2">
              <details className="border-b border-line py-4">
                <summary className="cursor-pointer font-semibold text-forest">Intake video transcript</summary>
                <p className="mt-3 whitespace-pre-line text-[15px] text-[#36423B]">
                  {intake.transcript || "Your transcript was deleted from your business library."}
                </p>
              </details>
              <details className="py-4">
                <summary className="cursor-pointer font-semibold text-forest">Your {qa.length} diagnostic answers</summary>
                <dl className="mt-3 grid gap-4">
                  {qa.map((q, i) => (
                    <div key={i}>
                      <dt className="font-semibold text-forest">
                        {i + 1}. {q.question}
                      </dt>
                      <dd className="mt-1 whitespace-pre-line text-[15px] text-[#36423B]">{q.answer || "Skipped"}</dd>
                    </div>
                  ))}
                </dl>
              </details>
            </section>
          </div>

          <aside className="grid min-w-0 flex-[1_1_300px] gap-5">
            <div className="grid gap-3 rounded-[20px] border border-line bg-white p-6">
              <img src="/assets/mascots/circles.png" alt="" className="h-[72px] w-auto" />
              <h2 className="text-[19px] font-extrabold">Get your team&apos;s view</h2>
              <p className="text-[15px] text-muted">
                Stakeholder interviews let teammates answer short questions about this problem. They&apos;re coming in
                the next update.
              </p>
            </div>
            <div className="grid gap-3 rounded-[20px] border border-line bg-white p-6">
              <h2 className="text-[19px] font-extrabold">What&apos;s next</h2>
              <Link href="/dashboard" className="rounded-full bg-green px-5 py-3 text-center font-semibold text-white hover:bg-forest hover:text-white">
                Go to my dashboard
              </Link>
              <Link href="/intake" className="rounded-full border border-line3 px-5 py-3 text-center font-semibold text-forest">
                Work on a new problem
              </Link>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

/** Answers saved, diagnosis not written yet: usually stopped at the plan limit. */
async function PendingDiagnosis({ id, statement, ownerId }: { id: string; statement: string; ownerId: string }) {
  const usage = await getPlanUsage(ownerId);
  return (
    <div className="bg-sand">
      <div className="mx-auto grid max-w-[860px] gap-6 px-6 pb-20 pt-10">
        <section className="rounded-3xl bg-forest p-9 text-white">
          <span className="text-[14px] text-[#C4D6CA]">Not finished yet · Problem space {problemCode(id)}</span>
          <h1 className="mt-3 text-[30px] font-extrabold leading-[1.2] text-white">{statement}</h1>
        </section>
        {usage && usage.remaining <= 0 ? (
          <QuotaPrompt usage={usage} />
        ) : (
          <section className="grid gap-4 rounded-[20px] border border-line bg-white p-8">
            <h2 className="text-[22px] font-extrabold">Your answers are saved</h2>
            <p className="text-[16px] text-[#36423B]">
              Inquew will write your diagnosis from your video and answers. This uses one diagnostic from your plan.
            </p>
            <FinishDiagnosisButton intakeId={id} />
          </section>
        )}
      </div>
    </div>
  );
}
