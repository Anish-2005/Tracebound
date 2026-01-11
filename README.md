# Tracebound

Agentic workflows with on-chain auditability, built for a 1-day hackathon (Weilliptic Agentic AI & On-Chain Workflows track).

## Problem in one paragraph
Teams need deterministic, auditable automation. Typical agent pipelines are opaque; debugging and compliance checks are painful. IntentLedger turns natural-language intents into explicit workflows, executes them with simple rule-based agents, and writes every step’s state hash on-chain for a tamper-evident trail.

## What it does
- Parse a natural-language intent into an ordered workflow JSON (stepId, agent, action, branching).
- Execute agents sequentially with deterministic, mockable behaviors (no AI hype, no real external APIs).
- Log each step’s status and output hash to an EVM contract for auditability.
- Visual frontend shows steps, branching, live execution statuses, and on-chain tx hashes.

## Architecture (simple view)

```
[Frontend (Next.js)] --intent--> [Backend (Node)] --calls--> [Agents]
	|                                   |                |
	|                                   |--tx hashes--> [IntentLedger.sol]
	|<----------- workflow + statuses --|                |
```

## Demo flow (2 minutes)
1) Open frontend and pick a preset intent (e.g., “Handle a support issue and log resolution”).
2) Preview shows the steps and branching (onSuccess/onFailure) before execution.
3) Run workflow: steps light up RUNNING → SUCCESS/FAILURE; final state shown.
4) On-chain panel shows tx hashes; click through to explorer for verification.

## Why on-chain auditability
- Tamper-evident record of each step’s outcome and payload hash.
- Independent verification by anyone with the tx hash; no trust in the app server.
- Clear failure tracing: which step failed, when, and with what output hash.

## Key components
- Smart contract: `contracts/IntentLedger.sol` — stores workflow creator, metadata hash, step logs, and final status (CREATED/RUNNING/COMPLETED/FAILED).
- Backend: `backend/src/workflow.js` — builds workflow JSON, runs agents (IntentParser, PolicyCheck, MockExternalService, AuditLogger), branches on failure, and logs to contract via `contractClient`.
- Frontend: `frontend/src/app/page.tsx` — presets, preview, live step statuses (PENDING/RUNNING/SUCCESS/FAILURE), branching hints, and on-chain tx list.

## Getting started
Backend
1) `cd backend && npm install`
2) Copy `.env.example` to `.env`; set `RPC_URL`, `PRIVATE_KEY`, `CONTRACT_ADDRESS` (deploy `IntentLedger.sol` to Sepolia/local), `ENABLE_ONCHAIN=true`.
3) `npm run dev`

Frontend
1) `cd frontend && npm install`
2) Copy `.env.local.example` to `.env.local`; set `NEXT_PUBLIC_API_BASE` (default http://localhost:4000).
3) `npm run dev`

## Constraints
- No token economics; no real external APIs; deterministic mock services.
- Rule-based agents only; no heavy AI claims.
- Built for clarity and auditability over scale.
