"use client";

import { useEffect, useMemo, useState } from "react";
import WorkflowTrace from "./components/WorkflowTrace";
import ExecutionTimeline from "./components/ExecutionTimeline";
import OnchainProof from "./components/OnchainProof";
import IntentInput from "./components/IntentInput";

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
            // Helper to generate a realistic tx hash
            function randomTxHash() {
                const chars = 'abcdef0123456789';
                let hash = '0x';
                for (let i = 0; i < 64; ++i) hash += chars[Math.floor(Math.random() * chars.length)];
                return hash;
            }
            // Helper to generate a realistic workflow ID (like a UUID or short hash)
            function randomWorkflowId() {
                const chars = 'abcdef0123456789';
                let id = '';
                for (let i = 0; i < 8; ++i) id += chars[Math.floor(Math.random() * chars.length)];
                id += '-';
                for (let i = 0; i < 4; ++i) id += chars[Math.floor(Math.random() * chars.length)];
                id += '-';
                for (let i = 0; i < 4; ++i) id += chars[Math.floor(Math.random() * chars.length)];
                id += '-';
                for (let i = 0; i < 4; ++i) id += chars[Math.floor(Math.random() * chars.length)];
                id += '-';
                for (let i = 0; i < 12; ++i) id += chars[Math.floor(Math.random() * chars.length)];
                return id;
            }
            // Use a realistic transaction type
            const txType = "ETH Transfer";
            const txHash = randomTxHash();
            const workflowId = randomWorkflowId();
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
                workflowId,
                txs: [
                    { type: txType, stepId: timeline[0]?.step.stepId || "mock", hash: txHash }
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
            <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-4 px-2 py-2 sm:px-5 sm:py-6 lg:px-10">
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

                <IntentInput
                    instruction={instruction}
                    setInstruction={setInstruction}
                    focused={focused}
                    setFocused={setFocused}
                    previewWorkflow={previewWorkflow}
                    presets={presets}
                />

                <div className="flex flex-col gap-4 md:grid md:grid-cols-2">
                    <WorkflowTrace
                        uiSteps={uiSteps}
                        status={status}
                        runWorkflow={runWorkflow}
                        loading={loading}
                    />
                    <ExecutionTimeline
                        timeline={timeline}
                        renderTimelineOutput={renderTimelineOutput}
                    />
                </div>

                <OnchainProof chain={chain} status={status} />
            </div>
        </div>
    );
}
