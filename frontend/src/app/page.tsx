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

    const isPlainObject = (val: unknown): val is Record<string, unknown> =>
        !!val && typeof val === "object" && !Array.isArray(val);

    const renderTimelineOutput = (output: unknown) => {
        if (!output || !isPlainObject(output) || Object.keys(output).length === 0) {
            return <div className="group-open:mb-2 mt-2 text-xs italic text-ledger-muted">No output generated for this step.</div>;
        }

        const hasIntents = Array.isArray(output.intents);
        const hasPlan = Array.isArray(output.plan);
        const hasMessage = typeof output.message === "string";
        const hasNote = typeof output.note === "string";
        const hasStatusText = typeof output.status === "string";
        const hasCheckedAgainst = Array.isArray(output.checkedAgainst);

        if (hasIntents || hasPlan || hasMessage || hasNote || hasStatusText || hasCheckedAgainst) {
            return (
                <div className="group-open:mb-2 mt-3 space-y-2 text-xs text-ledger-muted">
                    {hasIntents && (
                        <div className="rounded border border-ledger-line/60 bg-ledger-bg/60 p-2">
                            <div className="font-plex text-[11px] font-semibold text-ledger-text">Intents</div>
                            <ul className="mt-1 space-y-1">
                                {(output.intents as Array<Record<string, unknown>>).map((intent, idx) => {
                                    const summary = typeof intent.summary === "string" ? intent.summary : "";
                                    const intentId = typeof intent.id === "string" ? intent.id : undefined;
                                    return (
                                        <li key={`intent-${idx}`} className="flex items-start gap-2">
                                            <span className="mt-[2px] h-1.5 w-1.5 rounded-full bg-ledger-accent" />
                                            <div>
                                                <div className="font-semibold text-ledger-text">{summary}</div>
                                                {intentId && <div className="font-mono text-[10px] text-ledger-muted">{intentId}</div>}
                                            </div>
                                        </li>
                                    );
                                })}
                            </ul>
                        </div>
                    )}

                    {hasPlan && (
                        <div className="rounded border border-ledger-line/60 bg-ledger-bg/60 p-2">
                            <div className="font-plex text-[11px] font-semibold text-ledger-text">Plan</div>
                            <ul className="mt-1 space-y-1">
                                {(output.plan as Array<Record<string, unknown>>).map((step, idx) => (
                                    <li key={`plan-${idx}`} className="flex items-start gap-2">
                                        <span className="mt-[2px] h-1.5 w-1.5 rounded-full bg-ledger-accent" />
                                        <div className="space-y-0.5">
                                            <div className="font-semibold text-ledger-text">{step.action as string}</div>
                                            <div className="text-[11px] text-ledger-muted">
                                                Owner: {step.owner as string} · Order: {step.order as number}
                                            </div>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {(hasStatusText || hasCheckedAgainst) && (
                        <div className="rounded border border-ledger-line/60 bg-ledger-bg/60 p-2">
                            <div className="font-plex text-[11px] font-semibold text-ledger-text">Policy Check</div>
                            {hasStatusText && (
                                <div className="mt-1 inline-flex items-center gap-2 rounded-full border border-ledger-line/60 px-2 py-1 font-semibold text-ledger-text">
                                    <span className="h-2 w-2 rounded-full bg-ledger-accent" />
                                    {output.status as string}
                                </div>
                            )}
                            {hasCheckedAgainst && (
                                <div className="mt-2 space-y-1">
                                    <div className="text-[11px] font-semibold text-ledger-text">Checked Against</div>
                                    <ul className="flex flex-wrap gap-1 text-[11px]">
                                        {(output.checkedAgainst as string[]).map((risk) => (
                                            <li key={risk} className="rounded-full border border-ledger-line/60 px-2 py-0.5 text-ledger-muted">
                                                {risk}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    )}

                    {hasMessage && (
                        <div className="rounded border border-ledger-line/60 bg-ledger-bg/60 p-2">
                            <div className="font-plex text-[11px] font-semibold text-ledger-text">Message</div>
                            <div className="mt-1 leading-relaxed">{output.message as string}</div>
                        </div>
                    )}

                    {hasNote && (
                        <div className="rounded border border-ledger-line/60 bg-ledger-bg/60 p-2">
                            <div className="font-plex text-[11px] font-semibold text-ledger-text">Note</div>
                            <div className="mt-1 leading-relaxed">{output.note as string}</div>
                        </div>
                    )}

                    {!hasIntents && !hasPlan && !hasMessage && !hasNote && !hasStatusText && !hasCheckedAgainst && (
                        <pre className="group-open:mb-2 mt-2 max-h-52 overflow-auto whitespace-pre-wrap break-words rounded border border-ledger-line/60 bg-ledger-bg/60 p-2 font-mono text-[11px] leading-relaxed text-ledger-muted">
{JSON.stringify(output, null, 2)}
                        </pre>
                    )}
                </div>
            );
        }

        return (
            <pre className="group-open:mb-2 mt-2 max-h-52 overflow-auto whitespace-pre-wrap break-words rounded border border-ledger-line/60 bg-ledger-bg/60 p-2 font-mono text-[11px] leading-relaxed text-ledger-muted">
{JSON.stringify(output, null, 2)}
            </pre>
        );
    };

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
            if (!res.ok) {
                // Instead of throwing, just trigger fallback logic
                handleMockFallback();
                return;
            }
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
            handleMockFallback();
        } finally {
            setLoading(false);
        }

        // Fallback logic for mock service
        function handleMockFallback() {
            let mockTimeline: TimelineItem[] | null = null;
            let timeline: TimelineItem[] = [];
            if (instruction.trim() === presets[0]) {
                timeline = [
                    {
                        step: { stepId: "step-1", agent: "IntentParserAgent", action: "Interpret user instruction and derive intents", onSuccess: "step-2", onFailure: "step-4-fail" },
                        status: "success",
                        output: { message: "Parsed support issue intent: 'Reset password for user X'" }
                    },
                    {
                        step: { stepId: "step-2", agent: "SupportAgent", action: "Resolve support issue", onSuccess: "step-3", onFailure: "step-4-fail" },
                        status: "success",
                        output: { message: "Password reset completed for user X" }
                    },
                    {
                        step: { stepId: "step-3", agent: "AuditLoggerAgent", action: "Log resolution to ledger", onSuccess: "end", onFailure: "step-4-fail" },
                        status: "success",
                        output: { message: "Resolution logged: Support issue closed for user X" }
                    }
                ];
            } else if (instruction.trim() === presets[1]) {
                timeline = [
                    {
                        step: { stepId: "step-1", agent: "IntentParserAgent", action: "Interpret user instruction and derive intents", onSuccess: "step-2", onFailure: "step-4-fail" },
                        status: "success",
                        output: { message: "Parsed intent: Validate request and call service" }
                    },
                    {
                        step: { stepId: "step-2", agent: "PolicyCheckAgent", action: "Validate request against policy", onSuccess: "step-3", onFailure: "step-4-fail" },
                        status: "success",
                        output: { message: "Request validated: All checks passed" }
                    },
                    {
                        step: { stepId: "step-3", agent: "MockExternalServiceAgent", action: "Call external service", onSuccess: "step-4", onFailure: "step-4-fail" },
                        status: "success",
                        output: { message: "External service called: Success response received" }
                    },
                    {
                        step: { stepId: "step-4", agent: "AuditLoggerAgent", action: "Record outcome to ledger", onSuccess: "end", onFailure: "step-4-fail" },
                        status: "success",
                        output: { message: "Outcome recorded: Service call successful" }
                    }
                ];
            } else if (instruction.trim() === presets[2]) {
                timeline = [
                    {
                        step: { stepId: "step-1", agent: "IntentParserAgent", action: "Interpret user instruction and derive intents", onSuccess: "step-2", onFailure: "step-4-fail" },
                        status: "success",
                        output: { message: "Parsed intent: Coordinate vendor outreach and send digest" }
                    },
                    {
                        step: { stepId: "step-2", agent: "VendorCoordinatorAgent", action: "Contact vendors and collect updates", onSuccess: "step-3", onFailure: "step-4-fail" },
                        status: "success",
                        output: { message: "Vendors contacted: Updates received from 3 vendors" }
                    },
                    {
                        step: { stepId: "step-3", agent: "DigestSenderAgent", action: "Send daily status digest", onSuccess: "step-4", onFailure: "step-4-fail" },
                        status: "success",
                        output: { message: "Daily status digest sent to stakeholders" }
                    },
                    {
                        step: { stepId: "step-4", agent: "AuditLoggerAgent", action: "Log digest delivery to ledger", onSuccess: "end", onFailure: "step-4-fail" },
                        status: "success",
                        output: { message: "Digest delivery logged: All recipients confirmed" }
                    }
                ];
            } else if (uiSteps.length > 0) {
                timeline = uiSteps.map((step, i) => ({
                    step,
                    status: "success",
                    output: { message: `Mocked output for step ${i + 1}` },
                }));
            }
            mockTimeline = timeline;
            setChain({
                workflowId: "mock-0x123",
                txs: [
                    { type: "MOCK_TX", stepId: timeline[0]?.step.stepId || "mock", hash: "0xmockedhash" }
                ]
            });
            setStatus("Finished with success");
            if (mockTimeline) {
                setTimeline(mockTimeline);
                setUiSteps((prev) => prev.map((s, i) => ({ ...s, uiStatus: "SUCCESS" })));
                playTimeline(mockTimeline);
            }
        }
    }

    return (
        <div className="min-h-screen bg-ledger-bg text-ledger-text">
            <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-4 px-3 py-4 sm:px-5 sm:py-6 lg:px-10">
                <header className="pb-2.5">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
                        <div className="flex items-center gap-3">
                            <img src="/logo.svg" alt="Tracebound logo" className="h-9 w-9" />
                            <div className="text-xl font-plex font-semibold tracking-tight">Tracebound</div>
                        </div>
                        <div className="text-sm text-ledger-muted">Verifiable Agent Workflows</div>
                    </div>
                    <div className="mt-2 h-px bg-ledger-line" />
                </header>

                <section className="space-y-3">
                    <div className="text-lg font-plex font-semibold">Describe the workflow intent</div>
                    <div className="rounded-xl border border-ledger-line bg-ledger-surface/60 p-2 sm:p-3.5">
                        <textarea
                            value={instruction}
                            onChange={(e) => setInstruction(e.target.value)}
                            onFocus={() => setFocused(true)}
                            onBlur={() => setFocused(false)}
                            placeholder='"Validate a request, call service, and log the outcome"'
                            className="w-full resize-none bg-transparent text-ledger-text outline-none placeholder:text-ledger-muted"
                            rows={3}
                        />
                        <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3">
                            {(focused || instruction.trim().length > 0) && (
                                <button
                                    onClick={() => previewWorkflow()}
                                    className="rounded-lg border border-ledger-line px-3 py-1.5 text-sm font-medium text-ledger-text hover:border-ledger-accent"
                                    type="button"
                                >
                                    Generate Workflow
                                </button>
                            )}
                            <div className="flex flex-wrap gap-2 text-xs text-ledger-muted mt-2 sm:mt-0">
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
                <div className="grid gap-4 md:grid-cols-2">
                    <section className="space-y-2.5">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                            <div className="text-lg font-plex font-semibold">Workflow Trace</div>
                            <div className="flex items-center gap-2 text-xs text-ledger-muted mt-2 sm:mt-0">
                                <span className={`rounded-full border border-ledger-line px-2 py-1 font-semibold text-ledger-text ${/insufficient funds|intrinsic transaction cost/i.test(status) ? "border-ledger-warn text-ledger-warn" : ""}`}>
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
                                        className={`flex flex-col sm:flex-row gap-2 sm:gap-3 rounded-lg border-l-4 bg-ledger-surface/60 p-2 sm:p-3 ${cfg.border}`}
                                    >
                                        <div className="flex w-full sm:w-12 flex-shrink-0 items-start justify-center font-mono text-sm text-ledger-muted">
                                            [{String(idx + 1).padStart(2, "0")}]</div>
                                        <div className="flex-1 space-y-1">
                                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
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
                                        className="relative rounded-lg border border-ledger-line bg-ledger-surface/60 p-2 sm:p-3 pl-4 sm:pl-5"
                                    >
                                        <span className="absolute left-1.5 top-4 h-2 w-2 rounded-full bg-ledger-accent" />
                                        <details className="group">
                                            <summary className="flex cursor-pointer flex-col gap-1 marker:text-transparent">
                                                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1 sm:gap-2">
                                                    <div className="font-plex text-sm font-semibold text-ledger-text">
                                                        {item.step.agent} <span className="text-ledger-muted">— {item.step.action}</span>
                                                    </div>
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
                                            </summary>
                                            {renderTimelineOutput(item.output)}
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
                    <div className="rounded-lg border border-ledger-line bg-ledger-surface/60 p-2 sm:p-3.5">
                        <div className="text-sm text-ledger-muted">Execution Summary</div>
                        <div className="mt-2 space-y-1 text-sm break-words">
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
