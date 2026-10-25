import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="bg-forest px-7 pb-[34px] pt-[56px]">
      <div className="mx-auto grid max-w-[1240px] grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-9">
        <div>
          <img src="/assets/inquew-logo-white.png" alt="Inquew" className="h-[64px] w-auto" />
          <p className="mt-5 max-w-[34ch] text-[14px] text-[#DCE8E0]">
            Fixed-price consulting deliverables, priced in the open from $60 to $1,650.
          </p>
        </div>
        <div>
          <div className="text-[11.5px] font-bold uppercase tracking-[0.08em] text-[#9FBFAC]">Platform</div>
          <div className="mt-[14px] grid justify-items-start gap-[9px]">
            <Link href="/how-it-works" className="text-[14.5px] text-[#F3F5E8] hover:text-cyan">
              How It Works
            </Link>
            <Link href="/deliverables" className="text-[14.5px] text-[#F3F5E8] hover:text-cyan">
              Deliverables
            </Link>
            <Link href="/intake" className="text-[14.5px] text-[#F3F5E8] hover:text-cyan">
              Free diagnostic
            </Link>
            <Link href="/dashboard" className="text-[14.5px] text-[#F3F5E8] hover:text-cyan">
              Client dashboard
            </Link>
          </div>
        </div>
        <div>
          <div className="text-[11.5px] font-bold uppercase tracking-[0.08em] text-[#9FBFAC]">Company</div>
          <div className="mt-[14px] grid justify-items-start gap-[9px]">
            <Link href="/team" className="text-[14.5px] text-[#F3F5E8] hover:text-cyan">
              Team
            </Link>
            <Link href="/contact" className="text-[14.5px] text-[#F3F5E8] hover:text-cyan">
              Contact
            </Link>
            <Link href="/privacy" className="text-[14.5px] text-[#F3F5E8] hover:text-cyan">
              Privacy policy
            </Link>
            <span className="text-[14.5px] text-[#F3F5E8]">Terms of service</span>
          </div>
        </div>
        <div>
          <div className="text-[11.5px] font-bold uppercase tracking-[0.08em] text-[#9FBFAC]">Privacy posture</div>
          <p className="mt-[14px] text-[14px] text-[#DCE8E0]">
            Your data stays in your account, encrypted, and is never used to train AI. You can delete it anytime.
          </p>
        </div>
      </div>
      <div className="mx-auto mt-[34px] flex max-w-[1240px] flex-wrap justify-between gap-4 border-t border-[#2D7B5F] pt-[22px]">
        <span className="text-[13px] text-[#9FBFAC]">© 2026 Inquew. All rights reserved.</span>
        <span className="text-[13px] text-[#9FBFAC]">Built by AI agents, quality-checked by a consultant.</span>
      </div>
    </footer>
  );
}
