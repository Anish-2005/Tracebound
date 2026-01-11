import React from "react";

type Step = {
  stepId: string;
  agent: string;
  action: string;
  onSuccess: string | null;
  onFailure: string | null;
  uiStatus?: "PENDING" | "RUNNING" | "SUCCESS" | "FAILURE";
};

type Props = {
  uiSteps: Step[];
  status: string;
  runWorkflow: () => void;
  loading: boolean;
};

export default function WorkflowTrace({ uiSteps, status, runWorkflow, loading }: Props) {
  const statusMap = {
    PENDING: { label: "PENDING", color: "text-ledger-muted", border: "border-ledger-line" },
    RUNNING: { label: "RUNNING", color: "text-ledger-accent", border: "border-ledger-accent" },
    SUCCESS: { label: "SUCCESS", color: "text-ledger-accent", border: "border-ledger-accent" },
    FAILURE: { label: "FAILURE", color: "text-ledger-warn", border: "border-ledger-warn" },
  } as const;

  return (
    <section className="space-y-2.5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-lg font-plex font-semibold">Workflow Trace</div>
        <div className="flex items-center gap-2 text-xs text-ledger-muted mt-2 sm:mt-0">
          <span className={`rounded-full border border-ledger-line px-2 py-1 font-semibold text-ledger-text`}>
            {status}
          </span>
          <button
            onClick={runWorkflow}
            disabled={loading}
            className="rounded-lg border border-ledger-line bg-ledger-line/20 px-4 py-2 text-base font-medium text-ledger-text hover:border-ledger-accent disabled:cursor-not-allowed disabled:opacity-60 active:scale-95 transition sm:text-sm"
          >
            {loading ? "Running..." : "Run"}
          </button>
        </div>
      </div>
      <div className="h-px bg-ledger-line" />
      <div className="space-y-3">
        {uiSteps.map((item, idx) => {
          const cfg = statusMap[item.uiStatus as keyof typeof statusMap] || statusMap.PENDING;
          return (
            <div
              key={item.stepId}
              className={`flex flex-col gap-2 rounded-lg border-l-4 bg-ledger-surface/60 p-3 ${cfg.border} shadow-sm active:scale-[0.98] transition`}
            >
              <div className="flex w-full flex-shrink-0 items-start justify-center font-mono text-base text-ledger-muted">
                [{String(idx + 1).padStart(2, "0")}]</div>
              <div className="flex-1 space-y-1">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                  <div className="font-plex text-base font-semibold text-ledger-text">{item.agent}</div>
                  <span className={`text-xs font-semibold ${cfg.color}`}>{cfg.label}</span>
                </div>
                <div className="text-base text-ledger-muted">{item.action}</div>
                <div className="text-[12px] font-mono text-ledger-muted">
                  onSuccess → {item.onSuccess || "end"} · onFailure → {item.onFailure || "end"}
                </div>
              </div>
            </div>
          );
        })}
        {!uiSteps.length && (
          <div className="rounded-lg border border-ledger-line bg-ledger-surface/60 p-4 text-base text-ledger-muted">
            Generate a workflow to see the trace.
          </div>
        )}
      </div>
    </section>
  );
}
