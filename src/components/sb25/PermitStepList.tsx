import { CrsLink } from "@/components/chp/CrsLink";
import type { PermitStep } from "@/lib/sb25/types";

/** One cost-or-time mini cell inside a step card (shared shape for Cost and Time). */
function MiniCell({ heading, label, detail }: { heading: string; label: string; detail?: string }) {
  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-wide text-silver-muted">{heading}</p>
      <p className="mt-0.5 text-sm font-semibold text-navy">{label}</p>
      {detail && <p className="mt-0.5 text-xs text-muted">{detail}</p>}
    </div>
  );
}

/**
 * The permit-to-purchase process as a numbered list (reuses the site's oxblood
 * `step-num` circle convention from chp/StepList). Each step carries a 2-up
 * "Cost | Time" mini-grid and CRS citation chips. Pure presentational — data
 * comes from data/sb25/process.json.
 */
export function PermitStepList({ steps }: { steps: PermitStep[] }) {
  return (
    <ol className="space-y-5">
      {steps.map((s, i) => (
        <li key={s.title} className="flex gap-4">
          <span className="step-num">{i + 1}</span>
          <div className="min-w-0 flex-1">
            <p className="font-display text-xl text-navy">{s.title}</p>
            <p className="mt-1 text-muted">{s.detail}</p>
            {s.notes && s.notes.length > 0 && (
              <div className="mt-2 space-y-1 rounded-md border-l-2 border-amber bg-cream px-3 py-2">
                {s.notes.map((note, k) => (
                  <p key={k} className="text-sm text-muted">
                    {note}
                  </p>
                ))}
              </div>
            )}
            <div className="mt-2 grid grid-cols-2 gap-3 rounded-md border border-silver bg-cream p-3">
              <MiniCell heading="Cost" label={s.cost.label} detail={s.cost.detail} />
              <MiniCell heading="Time" label={s.time.label} detail={s.time.detail} />
            </div>
            {s.citations.length > 0 && (
              <p className="mt-2 text-sm">
                {s.citations.map((c, j) => (
                  <span key={c}>
                    {j > 0 && " · "}
                    <CrsLink citation={c} />
                  </span>
                ))}
              </p>
            )}
          </div>
        </li>
      ))}
    </ol>
  );
}
