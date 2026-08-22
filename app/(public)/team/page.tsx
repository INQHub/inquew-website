import Image from "next/image";
import Link from "next/link";

export default function TeamPage() {
  return (
    <section className="mx-auto max-w-[1000px] px-7 pb-20 pt-[72px]">
      <span className="text-[12.5px] font-semibold uppercase tracking-[0.08em] text-olive">Team</span>
      <h1 className="mt-[14px] max-w-[24ch] text-[46px] font-bold">
        Built by someone who kept watching small businesses get quoted out of the room.
      </h1>
      <div className="mt-12 grid grid-cols-[repeat(auto-fit,minmax(300px,1fr))] items-start gap-11">
        <div>
          <div className="rounded-[22px] border border-line bg-white p-[18px] shadow-[0_8px_30px_rgba(66,82,6,.08)]">
            <Image
              src="/assets/kenny-isibor.png"
              alt="Kenny Isibor"
              width={600}
              height={800}
              className="block w-full rounded-[14px] object-cover"
              style={{ aspectRatio: "3/4" }}
            />
            <p className="mt-4 text-center font-display text-[17px] font-semibold">
              Kenny Isibor — CEO and Founder of Inquew
            </p>
          </div>
        </div>
        <div className="grid gap-5">
          <p className="text-[18px] text-ink">
            Inquew exists because of a gap in the middle of the consulting market. I kept seeing large firms only
            serving large clients, with pricing to match.
            <br />
            AI tools are cheap, but they assume you already know how to scope a brief. Between the two sits everyone
            else — a business with a real operational problem and no design or technical vocabulary to describe it.
          </p>
          <div className="rounded-[18px] border border-line2 bg-sand p-6">
            <h3 className="text-[18px] font-semibold">Who we work with</h3>
            <div className="mt-[14px] grid gap-2 text-[14.5px] text-muted">
              <div>Small business owners and solo founders with a business problem and no technical vocabulary</div>
              <div>Early-stage teams that need a fast, low-cost prototype before fundraising</div>
              <div>Nonprofit and microenterprise operators priced out of traditional consulting</div>
              <div>Construction, e-commerce, govtech, and manufacturing operators</div>
            </div>
          </div>
          <Link
            href="/contact"
            className="justify-self-start rounded-xl border border-[#CFD8B8] bg-white px-6 py-[15px] font-semibold hover:border-green"
          >
            Get in touch
          </Link>
        </div>
      </div>
    </section>
  );
}
