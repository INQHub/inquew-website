import Link from "next/link";

export const metadata = { title: "Case studies — Inquew" };

// Real case studies get added here once clients approve them. Until then the page shows
// which industries they'll cover and invites clients to take part.
const UPCOMING = [
  { industry: "Trades and construction", img: "city" },
  { industry: "Logistics", img: "plane" },
  { industry: "Home services", img: "briefcase" }
];

export default function CaseStudiesPage() {
  return (
    <div>
      <section className="bg-sand">
        <div className="mx-auto flex max-w-[1200px] flex-wrap items-center gap-8 px-6 py-14">
          <div className="min-w-0 flex-[1_1_560px]">
            <h1 className="text-[46px] font-extrabold leading-[1.1]">How small businesses fix what&apos;s slowing them down</h1>
            <p className="mt-3 text-[18px] text-[#36423B]">
              Real stories from Inquew clients, written up with them and approved by them before anything is published.
            </p>
          </div>
          <img src="/assets/mascots/city.png" alt="" className="h-[160px] w-auto" />
        </div>
      </section>

      <section className="mx-auto grid max-w-[1200px] gap-6 px-6 py-14">
        <div className="grid grid-cols-[repeat(auto-fit,minmax(300px,1fr))] gap-6">
          {UPCOMING.map((c) => (
            <article key={c.industry} className="flex flex-col overflow-hidden rounded-[20px] border border-line">
              <div className="flex h-[150px] items-center justify-center bg-green-tint">
                <img src={`/assets/mascots/${c.img}.png`} alt="" className="h-[96px] w-auto" />
              </div>
              <div className="grid gap-2 p-6">
                <span className="text-[13px] font-bold uppercase tracking-[0.08em] text-olive">{c.industry}</span>
                <strong className="font-display text-[20px] text-forest">Case study coming soon</strong>
                <span className="text-[15px] text-muted">
                  We&apos;re working with our first clients now. Their stories will appear here.
                </span>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="bg-forest">
        <div className="mx-auto flex max-w-[1200px] flex-wrap items-center gap-8 px-6 py-14">
          <div className="flex h-[120px] w-[120px] flex-shrink-0 items-center justify-center rounded-full bg-white">
            <img src="/assets/mascots/plane.png" alt="" className="h-[84px] w-auto" />
          </div>
          <div className="min-w-0 flex-[1_1_420px]">
            <h2 className="text-[30px] font-extrabold text-white">Be our next case study</h2>
            <p className="mt-2 text-[#DCE8E0]">
              Tell us how Inquew helped your business. We&apos;ll write it up with you, and you approve every word.
            </p>
          </div>
          <Link href="/contact" className="rounded-full bg-sky px-6 py-[14px] font-semibold text-forest hover:bg-aqua hover:text-forest">
            Get in touch
          </Link>
        </div>
      </section>
    </div>
  );
}
