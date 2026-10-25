import Link from "next/link";

// Diagnostic plans from the V2 brief. Paid plans aren't purchasable yet (subscriptions are
// a later phase), so they show as "Coming soon" instead of a checkout button.
const PLANS = [
  {
    name: "Free",
    price: "$0",
    per: "",
    blurb: "For your first look at what's wrong.",
    features: ["1 diagnostic on your first visit", "Results saved to a free account", "Recommended next-step deliverables"],
    cta: { label: "Start free", href: "/intake" },
    featured: false
  },
  {
    name: "Pro Diagnostics",
    price: "$15",
    per: "/month",
    blurb: "For owners working through a few problems at once.",
    features: ["5 diagnostic tests a month", "5 sets of questions and stakeholder interviews", "Your business library builds over time"],
    cta: null,
    featured: false
  },
  {
    name: "Premium Diagnostics",
    price: "$20",
    per: "/month",
    blurb: "For teams improving the business every quarter.",
    features: [
      "7 diagnostic tests a month",
      "7 sets of questions and stakeholder interviews",
      "Quarterly report with recommended deliverables",
      "$10 per extra diagnostic"
    ],
    cta: null,
    featured: true
  }
];

export function PlanCards() {
  return (
    <div className="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-6">
      {PLANS.map((p) => (
        <div
          key={p.name}
          className={`flex flex-col gap-4 rounded-[20px] bg-white p-8 ${p.featured ? "border-2 border-forest" : "border border-line"}`}
        >
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-[20px] font-bold">{p.name}</h3>
            {p.featured && (
              <span className="whitespace-nowrap rounded-full bg-olive-tint px-[10px] py-1 text-[13px] font-bold text-olive">Most value</span>
            )}
          </div>
          <div className="font-display text-[42px] font-extrabold text-forest">
            {p.price}
            {p.per && <span className="text-[18px] font-semibold text-faint">{p.per}</span>}
          </div>
          <p className="text-muted">{p.blurb}</p>
          <ul className="grid list-disc gap-2 pl-5 text-[15px] text-[#36423B]">
            {p.features.map((f) => (
              <li key={f}>{f}</li>
            ))}
          </ul>
          {p.cta ? (
            <Link
              href={p.cta.href}
              className="mt-auto rounded-full border-2 border-green px-5 py-3 text-center font-semibold text-green hover:bg-green hover:text-white"
            >
              {p.cta.label}
            </Link>
          ) : (
            <span className="mt-auto rounded-full bg-line px-5 py-3 text-center font-semibold text-muted">Coming soon</span>
          )}
        </div>
      ))}
    </div>
  );
}
