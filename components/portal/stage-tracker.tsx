import { STAGES } from "@/lib/order-stage";

/** Sky progress bar with the four labeled deliverable stages. */
export function StageTracker({ stage, label }: { stage: number; label: string }) {
  const pct = ((stage + 1) / STAGES.length) * 100;
  return (
    <div className="grid gap-3">
      <div
        role="progressbar"
        aria-label={label}
        aria-valuenow={stage + 1}
        aria-valuemin={0}
        aria-valuemax={STAGES.length}
        aria-valuetext={STAGES[stage]?.label}
        className="h-3 overflow-hidden rounded-full bg-line"
      >
        <div className="h-full rounded-full bg-sky" style={{ width: `${pct}%` }} />
      </div>
      <ol className="grid grid-cols-2 gap-2 text-[13px] sm:grid-cols-4">
        {STAGES.map((s, i) => (
          <li key={s.label} className={i <= stage ? "text-forest" : "text-faint"}>
            <span className={i === stage ? "font-bold" : "font-semibold"}>{s.label}</span>
            {i === stage && <span className="block font-normal text-muted">{s.sub}</span>}
          </li>
        ))}
      </ol>
    </div>
  );
}
