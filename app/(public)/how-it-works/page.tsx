import Link from "next/link";
import { TIER_COLOR, TIER_LABEL, TIER_EDITS } from "@/lib/catalog";

const STEPS_LONG = [
  {
    n: 1,
    title: "Submit a 2-minute video describing your business problem",
    body: "Before you record, we show you exactly how AI is used and what happens to your video: it is transcribed to text, stored encrypted in your account, and never used to train AI. If you would rather not use AI, you can message us instead.",
    note: "Consent notice shown before recording"
  },
  {
    n: 2,
    title: "Pick a problem statement, then take the free diagnostic",
    body: "Your transcript becomes three candidate framings of the same problem. Pick the closest one, edit it, or ask for three new ones. Then answer up to seven questions about it, ending with the magic-wand question, and get a written diagnosis with recommended next steps.",
    note: "Your first diagnostic is free"
  },
  {
    n: 3,
    title: "Browse the deliverables menu and choose what you need",
    body: "Every item has the price on the front, from $60 to $1,650. Filter by tier, category, or price. Add optional walkthrough video or a 30-minute Zoom consultation where they apply.",
    note: "No minimum, no proposal"
  },
  {
    n: 4,
    title: "AI agents build it, a consultant checks it",
    body: "Inquew's AI agents build the deliverable from your diagnosis and documents. A consultant then checks it for accuracy and quality, and sends it back for rework if it falls short. This happens at every tier, including the $60 items.",
    note: "Consultant quality check at every tier"
  },
  {
    n: 5,
    title: "Receive your deliverable through your dashboard, or by secure email link",
    body: "Dashboard delivery is recommended: the file is posted to your secure account and email only notifies you. If you choose direct email, it arrives as a secure expiring link, never a raw attachment.",
    note: "Never a raw email attachment"
  }
];

export default function HowItWorksPage() {
  return (
    <div>
      <section className="mx-auto max-w-[900px] px-7 pb-6 pt-[72px]">
        <span className="text-[12.5px] font-semibold uppercase tracking-[0.08em] text-olive">Process</span>
        <h1 className="mt-[14px] max-w-[22ch] text-[46px] font-bold">
          From a two-minute video to a finished deliverable
        </h1>
        <p className="mt-[18px] max-w-[60ch] text-[18px] text-muted">
          Traditional consulting hides its process behind a proposal. Here is ours, in full.
        </p>
      </section>

      <section className="mx-auto grid max-w-[900px] gap-[18px] px-7 pb-10 pt-6">
        {STEPS_LONG.map((s) => (
          <div key={s.n} className="flex flex-wrap gap-6 rounded-[20px] border border-line bg-white p-7 shadow-card">
            <div className="flex h-[52px] w-[52px] flex-shrink-0 items-center justify-center rounded-full bg-forest font-display text-[20px] font-bold text-[#F3F5E8]">
              {s.n}
            </div>
            <div className="min-w-[240px] flex-1">
              <h2 className="text-[23px] font-semibold">{s.title}</h2>
              <p className="mt-[10px] text-muted">{s.body}</p>
              <div className="mt-[14px] inline-block rounded-[9px] border border-line2 bg-sand px-3 py-[6px] text-[13px] text-ink">
                {s.note}
              </div>
            </div>
          </div>
        ))}
      </section>

      <section className="mx-auto max-w-[900px] px-7 pb-20 pt-10">
        <div className="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-5">
          <div className="rounded-[20px] border border-green-border bg-green-tint p-[26px]">
            <h3 className="text-[19px] font-semibold text-green">What AI does here</h3>
            <div className="mt-[14px] grid gap-[9px] text-[14.5px]">
              <div>Transcribes your video and audio answers to text</div>
              <div>Drafts problem statements, diagnostic questions and your summary</div>
              <div>Builds the deliverables you buy</div>
            </div>
          </div>
          <div className="rounded-[20px] border border-olive-border bg-olive-tint p-[26px]">
            <h3 className="text-[19px] font-semibold text-olive">What AI never does</h3>
            <div className="mt-[14px] grid gap-[9px] text-[14.5px]">
              <div>Release a deliverable without a consultant&apos;s quality check</div>
              <div>Train on your data</div>
              <div>Create face or voice biometric data</div>
            </div>
          </div>
        </div>

        <div className="mt-5 rounded-[20px] border border-line bg-white p-7">
          <h3 className="text-[21px] font-semibold">Edits and revisions</h3>
          <p className="mt-[10px] text-[15px] text-muted">
            Each tier includes a set number of revision credits. If you run out, you can buy a single additional
            edit, or escalate to a call with your consultant.
          </p>
          <div className="mt-5 grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-[14px]">
            {[1, 2, 3].map((tier) => (
              <div key={tier} className="rounded-[14px] border border-line p-4">
                <span
                  className="rounded-full px-[9px] py-[3px] text-[10.5px] font-bold text-white"
                  style={{ background: TIER_COLOR[tier] }}
                >
                  {TIER_LABEL[tier]}
                </span>
                <div className="mt-3 font-display text-2xl font-bold">{TIER_EDITS[tier]}</div>
                <div className="text-[13px] text-faint">included edits</div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-[14px]">
          <Link href="/intake" className="rounded-[13px] bg-cyan px-[26px] py-4 text-[16px] font-semibold text-cyan-ink hover:bg-cyan-hover">
            Start your intake
          </Link>
          <Link
            href="/deliverables"
            className="rounded-[13px] border border-[#C9D1CC] bg-white px-[26px] py-4 text-[16px] font-semibold hover:border-green"
          >
            Skip to the menu
          </Link>
        </div>
      </section>
    </div>
  );
}
