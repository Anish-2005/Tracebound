"use client";

import { useMemo, useState } from "react";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:4000";
const demoPrompt =
  "Triage inbound vendor tickets, escalate risky items, and send a summary to compliance.";

type Step = {
  step_id: string;
  agent_name: string;
  action: string;
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

function StepCard({ item }: { item: TimelineItem }) {
  const badgeClass =
    item.status === "success"
      ? "border-green-400/60 text-green-300"
      : "border-rose-400/60 text-rose-300";
  return (
    <li className="rounded-xl border border-white/5 bg-white/5 p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <span className="font-semibold text-slate-50">{item.step.agent_name}</span>
          <span className="text-slate-300"> — {item.step.action}</span>
        </div>
        <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${badgeClass}`}>
          {item.status}
        </span>
      </div>
      <pre className="mt-3 whitespace-pre-wrap break-words text-xs text-slate-300">
        {JSON.stringify(item.output ?? {}, null, 2)}
      </pre>
    </li>
  );
}

function TxItem({ tx }: { tx: Tx }) {
  return (
    <li className="rounded-xl border border-white/5 bg-white/5 p-3">
      <div className="flex items-center justify-between gap-3">
        <div className="text-sm font-semibold text-slate-100">
          {tx.type}
          {tx.stepId ? ` (${tx.stepId})` : ""}
        </div>
        <a
          className="text-sky-300 underline-offset-4 hover:underline"
          href={`https://sepolia.etherscan.io/tx/${tx.hash}`}
          target="_blank"
          rel="noreferrer"
        >
          {tx.hash}
        </a>
      </div>
    </li>
  );
}

export default function Page() {
  const [instruction, setInstruction] = useState<string>("");
  const [timeline, setTimeline] = useState<TimelineItem[]>([]);
  const [chain, setChain] = useState<ChainInfo>(null);
  const [status, setStatus] = useState<string>("Idle");
  const [loading, setLoading] = useState<boolean>(false);
  const apiBase = useMemo(() => API_BASE.replace(/\/$/, ""), []);

  async function runWorkflow() {
    if (!instruction.trim()) {
      alert("Please provide an instruction.");
      return;
    }
    setLoading(true);
    setStatus("Running...");
    setTimeline([]);
    setChain(null);
    try {
      const res = await fetch(`${apiBase}/workflow/execute`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ instruction }),
      });
      const data = (await res.json()) as {
        timeline?: TimelineItem[];
        chain?: ChainInfo;
        finalStatus?: string;
      };
      setTimeline(data.timeline ?? []);
      setChain(data.chain ?? null);
      setStatus(`Finished with ${data.finalStatus}`);
    } catch (err) {
      console.error(err);
      setStatus("Error running workflow");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-5xl flex-col gap-4 px-6 py-8 font-display">
      <header className="flex items-center justify-between gap-4">
        <div>
          <div className="text-2xl font-bold uppercase tracking-[0.08em] text-slate-50">
            Tracebound
          </div>
          <div className="text-sm text-slate-300">Agentic workflow → on-chain audit</div>
        </div>
        <button
          type="button"
          onClick={() => setInstruction(demoPrompt)}
          className="rounded-xl bg-sky-400 px-4 py-2 text-slate-900 shadow-lg shadow-sky-400/40 transition hover:translate-y-px"
        >
          Use demo prompt
        </button>
      </header>

      <section className="rounded-2xl border border-white/5 bg-[#1e293b] p-5 shadow-2xl shadow-black/40">
        <h3 className="text-lg font-semibold text-slate-50">Natural language instruction</h3>
        <textarea
          value={instruction}
          onChange={(e) => setInstruction(e.target.value)}
          placeholder="Coordinate vendor outreach and send a daily status digest to the ops team."
          className="mt-3 w-full rounded-xl border border-white/10 bg-white/5 p-4 text-slate-100 outline-none transition focus:border-sky-300 focus:ring-2 focus:ring-sky-300/50"
          rows={4}
        />
        <div className="mt-3 flex items-center justify-between gap-3">
          <button
            onClick={runWorkflow}
            disabled={loading}
            className="rounded-xl bg-gradient-to-br from-sky-400 to-cyan-300 px-4 py-2 font-semibold text-slate-900 shadow-lg shadow-sky-400/40 transition hover:translate-y-px disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Running..." : "Run workflow"}
          </button>
          <span className="text-sm text-slate-300">{status}</span>
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-2">
        <section className="rounded-2xl border border-white/5 bg-[#1e293b] p-5 shadow-2xl shadow-black/40">
          <h3 className="text-lg font-semibold text-slate-50">Workflow steps</h3>
          <ul className="mt-3 flex flex-col gap-3">
            {timeline.map((item) => (
              <StepCard key={item.step.step_id} item={item} />
            ))}
            {!timeline.length && (
              <div className="text-sm text-slate-300">Awaiting execution...</div>
            )}
          </ul>
        </section>

        <section className="rounded-2xl border border-white/5 bg-[#1e293b] p-5 shadow-2xl shadow-black/40">
          <h3 className="text-lg font-semibold text-slate-50">On-chain log</h3>
          <div className="text-sm text-slate-300">
            {chain?.workflowId
              ? `Workflow ID: ${chain.workflowId}`
              : "On-chain disabled or pending"}
          </div>
          <ul className="mt-3 flex flex-col gap-3">
            {chain?.txs?.map((tx, idx) => (
              <TxItem key={`${tx.hash}-${idx}`} tx={tx} />
            ))}
            {(!chain || !chain.txs || chain.txs.length === 0) && (
              <div className="text-sm text-slate-300">No transactions yet.</div>
            )}
          </ul>
        </section>
      </div>
    </div>
  );
}
