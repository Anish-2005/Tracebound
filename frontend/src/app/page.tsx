"use client";

import { useEffect, useMemo, useState } from "react";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:4000";
const presets = [
    "Handle a support issue and log resolution",
    "Validate request, call service, and record outcome",
    "Coordinate vendor outreach and send a daily status digest",
];

type Step = {
    stepId: string;
    agent: string;
    action: string;
    onSuccess: string | null;
    onFailure: string | null;
};

type TimelineItem = {
    step: Step;
    status: "success" | "failure" | string;
    output?: unknown;
};

type Tx = {
    type: string;
    stepId?: string;
    hash: string;
};

type ChainInfo = {
    workflowId?: number | string;
    txs?: Tx[];
} | null;

type UiStep = Step & { uiStatus: "PENDING" | "RUNNING" | "SUCCESS" | "FAILURE" };

export default function Page() {
    const [instruction, setInstruction] = useState<string>("");
    const [uiSteps, setUiSteps] = useState<UiStep[]>([]);
    const [timeline, setTimeline] = useState<TimelineItem[]>([]);
    const [chain, setChain] = useState<ChainInfo>(null);
    const [status, setStatus] = useState<string>("Idle");
    const [loading, setLoading] = useState<boolean>(false);
    const [focused, setFocused] = useState<boolean>(false);
    const apiBase = useMemo(() => API_BASE.replace(/\/$/, ""), []);

    useEffect(() => {
        const first = presets[0];
        setInstruction(first);
        previewWorkflow(first);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    async function previewWorkflow(value?: string) {
        const intent = (value ?? instruction).trim();
        if (!intent) return;
        try {
            const res = await fetch(`${apiBase}/workflow/parse`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ instruction: intent }),
            });
            const data = await res.json();
            const steps = ((data.workflow?.steps as Step[]) || []).map((s) => ({ ...s }));
            setUiSteps(steps.map((s) => ({ ...s, uiStatus: "PENDING" })));
            setStatus("Ready to run");
        } catch (err) {
            console.error(err);
            setStatus("Preview failed");
        }
    }

    async function playTimeline(execTimeline: TimelineItem[]) {
        setUiSteps((prev) => prev.map((s) => ({ ...s, uiStatus: "PENDING" })));
        for (const item of execTimeline) {
            const id = item.step.stepId;
            setUiSteps((prev) => prev.map((s) => (s.stepId === id ? { ...s, uiStatus: "RUNNING" } : s)));
            await new Promise((r) => setTimeout(r, 300));
            setUiSteps((prev) =>
                prev.map((s) =>
                    s.stepId === id
                        ? { ...s, uiStatus: item.status === "success" ? "SUCCESS" : "FAILURE" }
                        : s
                )
            );
            if (item.status !== "success") break;
        }
    }

    async function runWorkflow() {
        const intent = instruction.trim();
        if (!intent) {
            alert("Please provide an instruction.");
            return;
        }

        await previewWorkflow();
        setLoading(true);
        setStatus("Running...");
        setTimeline([]);
        setChain(null);

        try {
            const res = await fetch(`${apiBase}/workflow/execute`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ instruction: intent }),
            });
            const data = (await res.json()) as {
                timeline?: TimelineItem[];
                chain?: ChainInfo;
                finalStatus?: string;
                workflow?: { steps: Step[] };
            };

            const steps = (data.workflow?.steps || uiSteps).map((s) => ({ ...s, uiStatus: "PENDING" as const }));
            setUiSteps(steps);

            const execTimeline = data.timeline ?? [];
            setTimeline(execTimeline);
            setChain(data.chain ?? null);
            setStatus(`Finished with ${data.finalStatus ?? "unknown"}`);
            await playTimeline(execTimeline);
        } catch (err) {
            console.error(err);
            setStatus("Error running workflow");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="min-h-screen bg-ledger-bg text-ledger-text">
            <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-4 px-5 py-6 lg:px-10">
                <header className="pb-2.5">
                    <div className="text-xl font-plex font-semibold tracking-tight">IntentLedger</div>
                    <div className="text-sm text-ledger-muted">Verifiable Agent Workflows</div>
                    <div className="mt-2 h-px bg-ledger-line" />
                </header>

                <section className="space-y-3">
                    <div className="text-lg font-plex font-semibold">Describe the workflow intent</div>
                    <div className="rounded-xl border border-ledger-line bg-ledger-surface/60 p-3.5">
                        <textarea
                            value={instruction}
                            onChange={(e) => setInstruction(e.target.value)}
                            onFocus={() => setFocused(true)}
                            onBlur={() => setFocused(false)}
                            placeholder='"Validate a request, call service, and log the outcome"'
                            className="w-full resize-none bg-transparent text-ledger-text outline-none placeholder:text-ledger-muted"
                            rows={3}
                        />
                        <div className="mt-3 flex flex-wrap items-center gap-3">
                            {(focused || instruction.trim().length > 0) && (
                                <button
                                    onClick={() => previewWorkflow()}
                                    className="rounded-lg border border-ledger-line px-3 py-1.5 text-sm font-medium text-ledger-text hover:border-ledger-accent"
                                    type="button"
                                >
                                    Generate Workflow
                                </button>
                            )}
                            <div className="flex flex-wrap gap-2 text-xs text-ledger-muted">
                                {presets.map((p) => (
                                    <button
                                        key={p}
                                        type="button"
                                        onClick={() => {
                                            setInstruction(p);
                                            previewWorkflow(p);
                                        }}
                                        className="rounded-full border border-ledger-line px-3 py-1 text-ledger-muted hover:border-ledger-accent hover:text-ledger-text"
                                    >
                                        {p}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>
                <div className="grid gap-4 lg:grid-cols-2">
                    <section className="space-y-2.5">
                        <div className="flex items-center justify-between">
                            <div className="text-lg font-plex font-semibold">Workflow Trace</div>
                            <div className="flex items-center gap-2 text-xs text-ledger-muted">
                                <span className="rounded-full border border-ledger-line px-2 py-1 font-semibold text-ledger-text">
                                    {status}
                                </span>
                                <button
                                    onClick={runWorkflow}
                                    disabled={loading}
                                    className="rounded-lg border border-ledger-line bg-ledger-line/20 px-3 py-1.5 text-sm font-medium text-ledger-text hover:border-ledger-accent disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    {loading ? "Running..." : "Run"}
                                </button>
                            </div>
                        </div>
                        <div className="h-px bg-ledger-line" />
                        <div className="space-y-2">
                            {uiSteps.map((item, idx) => {
                                const statusMap = {
                                    PENDING: { label: "PENDING", color: "text-ledger-muted", border: "border-ledger-line" },
                                    RUNNING: { label: "RUNNING", color: "text-ledger-accent", border: "border-ledger-accent" },
                                    SUCCESS: { label: "SUCCESS", color: "text-ledger-accent", border: "border-ledger-accent" },
                                    FAILURE: { label: "FAILURE", color: "text-ledger-warn", border: "border-ledger-warn" },
                                } as const;
                                const cfg = statusMap[item.uiStatus];
                                return (
                                    <div
                                        key={item.stepId}
                                        className={`flex gap-3 rounded-lg border-l-4 bg-ledger-surface/60 p-3 ${cfg.border}`}
                                    >
                                        <div className="flex w-12 flex-shrink-0 items-start justify-center font-mono text-sm text-ledger-muted">
                                            [{String(idx + 1).padStart(2, "0")}]
                                        </div>
                                        <div className="flex-1 space-y-1">
                                            <div className="flex items-center justify-between">
                                                <div className="font-plex text-sm font-semibold text-ledger-text">{item.agent}</div>
                                                <span className={`text-xs font-semibold ${cfg.color}`}>{cfg.label}</span>
                                            </div>
                                            <div className="text-sm text-ledger-muted">{item.action}</div>
                                            <div className="text-[11px] font-mono text-ledger-muted">
                                                onSuccess → {item.onSuccess || "end"} · onFailure → {item.onFailure || "end"}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                            {!uiSteps.length && (
                                <div className="rounded-lg border border-ledger-line bg-ledger-surface/60 p-4 text-sm text-ledger-muted">
                                    Generate a workflow to see the trace.
                                </div>
                            )}
                        </div>
                    </section>

                    <section className="space-y-2.5">
                        <div className="text-lg font-plex font-semibold">Execution Timeline</div>
                        <div className="h-px bg-ledger-line" />
                        <ul className="space-y-2">
                            {timeline.map((item, idx) => (
                                <li
                                    key={`${item.step.stepId}-${idx}`}
                                    className="relative rounded-lg border border-ledger-line bg-ledger-surface/60 p-3 pl-5"
                                >
                                    <span className="absolute left-2 top-4 h-2 w-2 rounded-full bg-ledger-accent" />
                                    <details className="group">
                                        <summary className="flex cursor-pointer flex-col gap-1 marker:text-transparent">
                                            <div className="flex items-center justify-between">
                                                <div className="font-plex text-sm font-semibold text-ledger-text">{item.step.agent}</div>
                                                <span
                                                    className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold ${
                                                        item.status === "success"
                                                            ? "border-ledger-accent text-ledger-accent"
                                                            : "border-ledger-warn text-ledger-warn"
                                                    }`}
                                                >
                                                    {item.status.toUpperCase()}
                                                </span>
                                            </div>
                                            <div className="text-xs text-ledger-muted">{item.step.action}</div>
                                        </summary>
                                        {item.output && Object.keys(item.output as object).length > 0 ? (
                                            <pre className="group-open:mb-2 mt-2 max-h-52 overflow-auto whitespace-pre-wrap break-words rounded border border-ledger-line/60 bg-ledger-bg/60 p-2 font-mono text-[11px] leading-relaxed text-ledger-muted">
    {JSON.stringify(item.output, null, 2)}
                                            </pre>
                                        ) : (
                                            <div className="group-open:mb-2 mt-2 text-xs italic text-ledger-muted">
                                                No output generated for this step.
                                            </div>
                                        )}
                                    </details>
                                </li>
                            ))}
                            {!timeline.length && (
                                <div className="text-sm text-ledger-muted">Run to view execution timeline.</div>
                            )}
                        </ul>
                    </section>
                </div>

                <section className="space-y-2.5 pb-8">
                    <div className="text-lg font-plex font-semibold">On-chain Proof</div>
                    <div className="h-px bg-ledger-line" />
                    <div className="rounded-lg border border-ledger-line bg-ledger-surface/60 p-3.5">
                        <div className="text-sm text-ledger-muted">Execution Summary</div>
                        <div className="mt-2 space-y-1 text-sm">
                            <div className="font-mono text-ledger-text">Workflow ID: {chain?.workflowId ?? "–"}</div>
                            <div className="font-mono text-ledger-text">Final State: {status.replace("Finished with ", "")}</div>
                            <div className="font-mono text-ledger-text">Transactions:</div>
                            <ul className="space-y-1 pl-4">
                                {chain?.txs?.map((tx, idx) => (
                                    <li key={`${tx.hash}-${idx}`} className="font-mono text-xs text-ledger-muted">
                                        {tx.type}: <a className="text-ledger-accent underline-offset-2 hover:underline" href={`https://sepolia.etherscan.io/tx/${tx.hash}`} target="_blank" rel="noreferrer">{tx.hash}</a>
                                    </li>
                                ))}
                                {(!chain || !chain.txs || chain.txs.length === 0) && (
                                    <li className="text-xs text-ledger-muted">No transactions yet.</li>
                                )}
                            </ul>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
}
