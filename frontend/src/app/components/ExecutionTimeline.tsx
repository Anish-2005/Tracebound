import React from "react";

type Step = {
  stepId: string;
  agent: string;
  action: string;
  onSuccess: string | null;
  onFailure: string | null;
};

type TimelineItem = {
  step: Step;
  status: string;
  output?: unknown;
};

type Props = {
  timeline: TimelineItem[];
  renderTimelineOutput: (output: unknown) => React.ReactNode;
};

export default function ExecutionTimeline({ timeline, renderTimelineOutput }: Props) {
  return (
    <section className="space-y-2.5">
      <div className="text-lg font-plex font-semibold">Execution Timeline</div>
      <div className="h-px bg-ledger-line" />
      <ul className="space-y-3">
        {timeline.map((item, idx) => (
          <li
            key={`${item.step.stepId}-${idx}`}
            className="relative rounded-lg border border-ledger-line bg-ledger-surface/60 p-3 pl-5 shadow-sm active:scale-[0.98] transition"
          >
            <span className="absolute left-2 top-4 h-2 w-2 rounded-full bg-ledger-accent" />
            <details className="group">
              <summary className="flex cursor-pointer flex-col gap-1 marker:text-transparent">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1 sm:gap-2">
                  <div className="font-plex text-base font-semibold text-ledger-text">
                    {item.step.agent} <span className="text-ledger-muted">— {item.step.action}</span>
                  </div>
                  <span
                    className={`rounded-full border px-2 py-0.5 text-[12px] font-semibold ${
                      item.status === "success"
                        ? "border-ledger-accent text-ledger-accent"
                        : "border-ledger-warn text-ledger-warn"
                    }`}
                  >
                    {item.status.toUpperCase()}
                  </span>
                </div>
              </summary>
              {renderTimelineOutput(item.output)}
            </details>
          </li>
        ))}
        {!timeline.length && (
          <div className="text-base text-ledger-muted">Run to view execution timeline.</div>
        )}
      </ul>
    </section>
  );
}
