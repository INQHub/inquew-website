import { ContactForm } from "@/components/contact-form";

export default function ContactPage() {
  return (
    <section className="mx-auto max-w-[960px] px-7 pb-20 pt-[72px]">
      <h1 className="text-[44px] font-bold">Contact</h1>
      <p className="mt-[14px] max-w-[52ch] text-[17px] text-muted">
        Questions about a deliverable, scope beyond the menu, or a request to skip the AI intake entirely — all
        fine.
      </p>
      <div className="mt-10 grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] items-start gap-6">
        <ContactForm />
        <div className="grid gap-4">
          <div className="rounded-[18px] border border-green-border bg-green-tint p-6">
            <h3 className="text-[17px] font-semibold text-green">Prefer no AI at all?</h3>
            <p className="mt-2 text-[14.5px] text-[#4A6B5A]">
              You can decline the intake notice and work with a consultant directly. Nothing gets transcribed,
              nothing gets processed.
            </p>
          </div>
          <div className="rounded-[18px] border border-line bg-white p-6">
            <h3 className="text-[17px] font-semibold">Response time</h3>
            <p className="mt-2 text-[14.5px] text-muted">
              One business day for general questions. Same day for anything about an active order.
            </p>
          </div>
          <div className="rounded-[18px] border border-line bg-white p-6">
            <h3 className="text-[17px] font-semibold">Scope beyond the menu</h3>
            <p className="mt-2 text-[14.5px] text-muted">
              If what you need is larger than a Tier 3 build, we can discuss a custom pricing solution to meet your
              needs.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
