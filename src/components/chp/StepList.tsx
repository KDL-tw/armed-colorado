import type { CrsStep } from "@/lib/chp/types";
import { CrsLink } from "./CrsLink";

/**
 * Numbered step list (the obtain/renew infographic). `steps` is the
 * positive case; `exceptions` (if provided) renders below as a separate
 * "Exceptions & exemptions" list.
 */
export function StepList({
  steps,
  exceptions,
  stepLabel,
}: {
  steps: CrsStep[];
  exceptions?: CrsStep[];
  stepLabel: string;
}) {
  return (
    <div>
      <ol className="space-y-5">
        {steps.map((step, i) => (
          <li key={i} className="flex gap-4">
            <span className="step-num">{i + 1}</span>
            <div>
              <p className="font-display text-xl text-navy">{step.title}</p>
              <p className="mt-1 text-muted">{step.detail}</p>
              <p className="mt-1 text-sm">
                {step.citations.map((c, j) => (
                  <span key={c}>
                    {j > 0 && " · "}
                    <CrsLink citation={c} />
                  </span>
                ))}
              </p>
            </div>
          </li>
        ))}
      </ol>
      {exceptions && exceptions.length > 0 ? (
        <div className="callout mt-8">
          <p className="font-display text-lg text-navy">Exceptions &amp; exemptions</p>
          <ul className="mt-2 space-y-2">
            {exceptions.map((e, i) => (
              <li key={i}>
                <strong>{e.title}:</strong> {e.detail}{" "}
                {e.citations.map((c, j) => (
                  <span key={c}>
                    {j > 0 && " · "}
                    <CrsLink citation={c} />
                  </span>
                ))}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
