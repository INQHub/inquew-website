import Link from "next/link";

export const metadata = { title: "Privacy policy — Inquew" };

// Plain-language privacy policy. Have an attorney review before launch, and update the
// "Last updated" date and provider list whenever they change.
const LAST_UPDATED = "[date]";

const PROVIDERS = [
  { name: "Vercel", does: "Hosts the Inquew website and app", data: "Everything passing through the site while it's in use" },
  { name: "Supabase", does: "Database and file storage", data: "Account details, recordings, transcripts, uploads, messages and deliverables" },
  { name: "OpenAI (Whisper API)", does: "Turns video and audio answers into text", data: "The audio from your recordings" },
  {
    name: "Anthropic (Claude API)",
    does: "Drafts problem statements, questions, summaries and deliverables",
    data: "Transcripts, answers and the documents used for your work"
  },
  { name: "Stripe", does: "Processes payments", data: "Name, email and card details. Inquew never sees your full card number." },
  { name: "Resend", does: "Sends email notifications", data: "Your name, email address and the notification's content" }
];

const SECTIONS = [
  { id: "collect", title: "What we collect" },
  { id: "ai", title: "How AI is used" },
  { id: "uploads", title: "Before you upload" },
  { id: "protect", title: "How we protect it" },
  { id: "retention", title: "How long we keep it" },
  { id: "rights", title: "Delete or download" },
  { id: "providers", title: "Service providers" },
  { id: "contact", title: "Contact" }
];

export default function PrivacyPage() {
  return (
    <div className="mx-auto grid max-w-[1200px] gap-8 px-6 pb-20 pt-12">
      <div>
        <h1 className="text-[44px] font-extrabold">Privacy policy</h1>
        <p className="mt-1 text-muted">Last updated {LAST_UPDATED} · Version 1.0</p>
      </div>

      <section aria-labelledby="short" className="grid gap-4 rounded-[22px] bg-green-tint p-7">
        <h2 id="short" className="text-[24px] font-extrabold">
          The short version
        </h2>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-4">
          <Card title="Your data stays yours.">No other client can see it. It&apos;s never sold or shared with competitors.</Card>
          <Card title="Not used to train AI.">Not by us, and our AI providers&apos; API terms don&apos;t allow it either.</Card>
          <Card title="Kept until you delete it.">Your business library makes future work better. Delete or download it anytime.</Card>
          <Card title="Encrypted.">Encrypted in transit and at rest, with expiring links for downloads.</Card>
        </div>
      </section>

      <div className="flex flex-wrap items-start gap-10">
        <nav aria-label="Policy sections" className="grid flex-[1_1_220px] gap-[6px] rounded-2xl bg-sand p-5 text-[15px]">
          <strong className="pb-1 text-forest">On this page</strong>
          {SECTIONS.map((s) => (
            <a key={s.id} href={`#${s.id}`}>
              {s.title}
            </a>
          ))}
        </nav>

        <article className="grid min-w-0 max-w-[760px] flex-[999_1_560px] gap-8 text-[16px] leading-[1.65]">
          <Section id="collect" title="What we collect">
            Your intake video and its transcript, audio and typed answers, documents you upload, messages, and account
            and billing details. We never create face or voice biometric data such as face geometry or voiceprints.
          </Section>
          <Section id="ai" title="How AI is used">
            AI drafts problem statements, asks diagnostic questions, writes summaries, and AI agents build deliverables. A
            consultant checks every deliverable before release. Inquew never uses your data to train AI models.
          </Section>
          <Section id="uploads" title="Before you upload">
            <span className="block rounded-2xl bg-olive-tint p-4 text-[#36423B]">
              Please black out sensitive details first. Do not upload financial statements, Social Security or
              driver&apos;s license numbers, bank details, API keys or trade secrets.
            </span>
          </Section>
          <Section id="protect" title="How we protect it">
            Every record is tied to your account and checked on every request, so no other client can see it. Files are
            stored privately and only ever shared through short-lived signed links. Inquew never shares your information or
            trade secrets with competitors, and every deliverable is custom to your problem and documents.
          </Section>
          <Section id="retention" title="How long we keep it">
            While your account is active, so future diagnostics build on what you&apos;ve shared, until you delete it. Our AI
            providers may keep a temporary copy for a limited time for abuse monitoring (up to 30 days at OpenAI), then
            delete it. Completed deliverables, purchase records and terms acceptances are kept for 7 years for legal and
            accounting purposes.
          </Section>
          <Section id="rights" title="Delete or download">
            In <Link href="/dashboard/account">Account › Data and privacy</Link> you can delete your recordings and
            transcripts and download a copy of your data.
          </Section>
          <section id="providers" className="grid gap-3">
            <h2 className="text-[22px] font-extrabold">Service providers</h2>
            <p>Inquew uses these companies to run the service. Each handles only the data it needs, under a data processing agreement.</p>
            <div className="overflow-x-auto rounded-2xl border border-line">
              <table className="w-full min-w-[560px] border-collapse text-[15px]">
                <thead>
                  <tr className="bg-sand text-left">
                    <th scope="col" className="px-4 py-3 font-semibold">Provider</th>
                    <th scope="col" className="px-4 py-3 font-semibold">What it does</th>
                    <th scope="col" className="px-4 py-3 font-semibold">Data it handles</th>
                  </tr>
                </thead>
                <tbody>
                  {PROVIDERS.map((p) => (
                    <tr key={p.name}>
                      <th scope="row" className="border-t border-line px-4 py-3 text-left font-semibold text-forest">{p.name}</th>
                      <td className="border-t border-line px-4 py-3">{p.does}</td>
                      <td className="border-t border-line px-4 py-3">{p.data}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-[15px] text-muted">
              OpenAI and Anthropic don&apos;t train their models on data sent through their APIs. We&apos;ll update this list
              before adding a new provider.
            </p>
          </section>
          <Section id="contact" title="Contact">
            Questions or requests about your data? <Link href="/contact">Send us a message</Link>.
          </Section>
        </article>
      </div>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl bg-white p-4">
      <strong className="text-forest">{title}</strong> {children}
    </div>
  );
}

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="grid gap-2">
      <h2 className="text-[22px] font-extrabold">{title}</h2>
      <p>{children}</p>
    </section>
  );
}
