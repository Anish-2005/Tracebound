'use client';

import { useMemo, useState } from 'react';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:4000';

const demoPrompt =
  'Triage inbound vendor tickets, escalate risky items, and send a summary to compliance.';

function StepCard({ item }) {
  const badgeClass = item.status === 'success' ? 'pill success' : 'pill failure';
  return (
    <li className="timeline-item">
      <div className="row">
        <div>
          <strong>{item.step.agent_name}</strong> — {item.step.action}
        </div>
        <span className={badgeClass}>{item.status}</span>
      </div>
      <pre className="muted small">{JSON.stringify(item.output || {}, null, 2)}</pre>
    </li>
  );
}

function TxItem({ tx }) {
  return (
    <li className="timeline-item">
      <div className="row">
        <div><strong>{tx.type}</strong>{tx.stepId ? ` (${tx.stepId})` : ''}</div>
        <a href={`https://sepolia.etherscan.io/tx/${tx.hash}`} target="_blank" rel="noreferrer">
          {tx.hash}
        </a>
      </div>
    </li>
  );
}

export default function Page() {
  const [instruction, setInstruction] = useState('');
  const [timeline, setTimeline] = useState([]);
  const [chain, setChain] = useState(null);
  const [status, setStatus] = useState('Idle');
  const [loading, setLoading] = useState(false);
  const apiBase = useMemo(() => API_BASE.replace(/\/$/, ''), []);

  async function runWorkflow() {
    if (!instruction.trim()) {
      alert('Please provide an instruction.');
      return;
    }
    setLoading(true);
    setStatus('Running...');
    setTimeline([]);
    setChain(null);
    try {
      const res = await fetch(`${apiBase}/workflow/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ instruction }),
      });
      const data = await res.json();
      setTimeline(data.timeline || []);
      setChain(data.chain || null);
      setStatus(`Finished with ${data.finalStatus}`);
    } catch (err) {
      console.error(err);
      setStatus('Error running workflow');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page">
      <header className="top">
        <div>
          <div className="brand">Tracebound</div>
          <div className="muted">Agentic workflow → on-chain audit</div>
        </div>
        <button type="button" onClick={() => setInstruction(demoPrompt)}>
          Use demo prompt
        </button>
      </header>

      <section className="card">
        <h3>Natural language instruction</h3>
        <textarea
          value={instruction}
          onChange={(e) => setInstruction(e.target.value)}
          placeholder="Coordinate vendor outreach and send a daily status digest to the ops team."
        />
        <div className="row" style={{ marginTop: 12 }}>
          <button onClick={runWorkflow} disabled={loading}>
            {loading ? 'Running...' : 'Run workflow'}
          </button>
          <span className="muted">{status}</span>
        </div>
      </section>

      <div className="grid">
        <section className="card">
          <h3>Workflow steps</h3>
          <ul className="timeline">
            {timeline.map((item) => (
              <StepCard key={item.step.step_id} item={item} />
            ))}
            {!timeline.length && <div className="muted small">Awaiting execution...</div>}
          </ul>
        </section>
        <section className="card">
          <h3>On-chain log</h3>
          <div className="muted small">
            {chain?.workflowId ? `Workflow ID: ${chain.workflowId}` : 'On-chain disabled or pending'}
          </div>
          <ul className="timeline">
            {chain?.txs?.map((tx, idx) => (
              <TxItem key={`${tx.hash}-${idx}`} tx={tx} />
            ))}
            {(!chain || !chain.txs || chain.txs.length === 0) && (
              <div className="muted small">No transactions yet.</div>
            )}
          </ul>
        </section>
      </div>
    </div>
  );
}
