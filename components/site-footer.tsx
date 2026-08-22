import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="bg-forest px-7 pb-[34px] pt-[56px]">
      <div className="mx-auto grid max-w-[1240px] grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-9">
        <div>
          <div className="font-display text-[27px] font-bold tracking-[0.18em] text-white">INQUEW</div>
          <div className="mt-[5px] text-[9.5px] tracking-[0.19em] text-[#C9D6A0]">
            SAVE MORE MONEY, ACHIEVE MORE SUCCESS
          </div>
          <p className="mt-5 max-w-[34ch] text-[14px] text-[#C9D6A0]">
            A la carte consulting deliverables, priced in the open from $60 to $1,500.
          </p>
        </div>
        <div>
          <div className="text-[11.5px] font-bold uppercase tracking-[0.08em] text-[#96A86A]">Platform</div>
          <div className="mt-[14px] grid justify-items-start gap-[9px]">
            <Link href="/how-it-works" className="text-[14.5px] text-[#F3F5E8] hover:text-cyan">
              How It Works
            </Link>
            <Link href="/deliverables" className="text-[14.5px] text-[#F3F5E8] hover:text-cyan">
              Deliverables
            </Link>
            <Link href="/intake" className="text-[14.5px] text-[#F3F5E8] hover:text-cyan">
              Video intake
            </Link>
            <Link href="/dashboard" className="text-[14.5px] text-[#F3F5E8] hover:text-cyan">
              Client dashboard
            </Link>
          </div>
        </div>
        <div>
          <div className="text-[11.5px] font-bold uppercase tracking-[0.08em] text-[#96A86A]">Company</div>
          <div className="mt-[14px] grid justify-items-start gap-[9px]">
            <Link href="/team" className="text-[14.5px] text-[#F3F5E8] hover:text-cyan">
              Team
            </Link>
            <Link href="/contact" className="text-[14.5px] text-[#F3F5E8] hover:text-cyan">
              Contact
            </Link>
            <span className="text-[14.5px] text-[#F3F5E8]">Privacy policy</span>
            <span className="text-[14.5px] text-[#F3F5E8]">Terms of service</span>
          </div>
        </div>
        <div>
          <div className="text-[11.5px] font-bold uppercase tracking-[0.08em] text-[#96A86A]">Privacy posture</div>
          <p className="mt-[14px] text-[14px] text-[#C9D6A0]">
            Your video is transcribed to text only — we never store facial or voice biometric data.
          </p>
        </div>
      </div>
      <div className="mx-auto mt-[34px] flex max-w-[1240px] flex-wrap justify-between gap-4 border-t border-[#5A6B22] pt-[22px]">
        <span className="text-[13px] text-[#96A86A]">© 2026 Inquew. All rights reserved.</span>
        <span className="text-[13px] text-[#96A86A]">Every deliverable is human-made and human-reviewed.</span>
      </div>
    </footer>
  );
}
