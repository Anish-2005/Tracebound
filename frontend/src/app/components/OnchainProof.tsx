import React from "react";

type Tx = {
  type: string;
  stepId?: string;
  hash: string;
};

type ChainInfo = {
  workflowId?: number | string;
  txs?: Tx[];
} | null;

type Props = {
  chain: ChainInfo;
  status: string;
};

export default function OnchainProof({ chain, status }: Props) {
  return (
    <section className="space-y-2.5 pb-8">
      <div className="text-lg font-plex font-semibold">On-chain Proof</div>
      <div className="h-px bg-ledger-line" />
      <div className="rounded-lg border border-ledger-line bg-ledger-surface/60 p-3 sm:p-3.5">
        <div className="text-base text-ledger-muted">Execution Summary</div>
        <div className="mt-2 space-y-1 text-base break-words">
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
  );
}
