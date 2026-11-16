import { CrsLink } from "@/components/chp/CrsLink";
import type { PermitStep } from "@/lib/sb25/types";

/** One cost-or-time mini cell inside a step card (shared shape for Cost and Time). */
function MiniCell({ heading, label, detail }: { heading: string; label: string; detail?: string }) {
  return (
    <div>
      <div className="text-xs font-bold uppercase tracking-wide text-white/40">{heading}</div>
      <div className="text-sm font-semibold text-white">{label}</div>
      {detail && <div className="text-xs text-white/50">{detail}</div>}
    </div>
  );
}

/**
 * The permit-to-purchase process as a vertical numbered graphic. Each step is a
 * card with title + detail and a 2-up "Cost | Time" mini-grid, plus CRS citation
 * chips. Pure presentational — data comes from data/sb25/process.json.
 */
export function PermitStepList({ steps }: { steps: PermitStep[] }) {
  return (
    <ol className="relative space-y-6 border-l border-white/10 pl-6">
      {steps.map((s, i) => (
        <li key={s.title} className="relative">
          <span className="absolute -left-[31px] top-0 flex h-8 w-8 items-center justify-center rounded-full bg-white/10 font-bold text-white ring-2 ring-white/20">
            {i + 1}
          </span>
          <h3 className="pr-6 font-bold text-white">{s.title}</h3>
          <p className="mt-1 text-white/70">{s.detail}</p>
          <div className="mt-2 grid grid-cols-2 gap-3 rounded-lg border border-white/10 bg-white/[0.03] p-3">
            <MiniCell heading="Cost" label={s.cost.label} detail={s.cost.detail} />
            <MiniCell heading="Time" label={s.time.label} detail={s.time.detail} />
          </div>
          {s.citations.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {s.citations.map((c) => (
                <CrsLink key={c} citation={c} />
              ))}
            </div>
          )}
        </li>
      ))}
    </ol>
  );
}
