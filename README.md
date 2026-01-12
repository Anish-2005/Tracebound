# Tracebound

![build](https://img.shields.io/github/actions/workflow/status/<owner>/<repo>/ci.yml) ![license](https://img.shields.io/github/license/<owner>/<repo>) ![solidity](https://img.shields.io/badge/solidity-0.8.x-blue) ![hardhat](https://img.shields.io/badge/hardhat-ready-purple) ![nextjs](https://img.shields.io/badge/next.js-13-black)

Tracebound is a production-ready reference application for auditable, verifiable workflows. It records workflow intents on-chain while offering a polished web UI for end-to-end trace visualization, making it easy to investigate, verify, and audit automation runs.

Everything in this repository is working and can be run locally to exercise the full intent lifecycle: submission → policy validation → on-chain recording → trace visualization.

**Project highlights**
- Immutable intent recording via `IntentLedger` and `WorkflowAudit` smart contracts.
- Off-chain agents and services that validate policies, orchestrate workflows, and emit structured audit logs.
- Next.js UI that visualizes execution timelines, step statuses, and on-chain transaction proofs.
- Developer tooling with Hardhat for compilation, deployment, and testing.

**Quick links**
- Contracts: [backend/contracts](backend/contracts)
- Backend: [backend/src](backend/src)
- Deployment scripts: [backend/scripts](backend/scripts)
- Frontend: [frontend/src/app](frontend/src/app)

**High-level architecture**

```
  [Browser / Next.js UI]
	  ↓  submit intent
  [Backend API & Agents]
	  ↓  validate & orchestrate
  [Smart Contracts on EVM]
	  ↕  store step logs & proofs
  [UI] ← read events & show verifiable traces
```

**Features**
- On-chain provenance: every workflow step produces a verifiable on-chain record.
- Policy validation: agents validate intent compliance before/actions during execution.
- Visual trace explorer: timeline, step outputs, branching, and tx links.
- Full developer workflow: compile, deploy, test, run, and inspect locally.

## Quickstart (local)

Prerequisites: Node.js (16+), npm, Git.

1) Clone the repo

```bash
git clone <repo-url>
cd Tracebound
```

2) Start a local chain and deploy contracts

```powershell
cd backend
npm install

# Start Hardhat node in a terminal
npx hardhat node

# Deploy contracts to the local node (new terminal)
node scripts/deploy.js
```

3) Start the backend server (agents + API)

```powershell
cd backend
npm install
# Example start (repository includes the server entrypoint)
node src/server.js
```

4) Start the frontend

```powershell
cd frontend
npm install
npm run dev
# Visit http://localhost:3000
```

Environment variables
- Backend: copy `.env.example` → `.env` and set `RPC_URL`, `PRIVATE_KEY`, `CONTRACT_ADDRESS` as required.
- Frontend: copy `.env.local.example` → `.env.local` and set `NEXT_PUBLIC_API_BASE` (defaults to `http://localhost:4000`).

## Testing

Run contract tests and linters from the `backend` folder (Hardhat):

```powershell
cd backend
npm test
```

## Developer notes
- Contracts live under `backend/contracts` and are managed with Hardhat.
- Backend agents are under `backend/src` and are responsible for parsing intents, applying policies, auditing, and interacting with the contracts.
- Frontend code is in `frontend/src/app` with components for `ExecutionTimeline`, `WorkflowTrace`, and `OnchainProof`.

## Contributing
- Open an issue or PR. Add tests for new behavior and follow existing code patterns.

## License
- See the `LICENSE` file in the repository root.

---

If you'd like, I can also:
- Add the suggested repository topic tags and GitHub badges (owner/repo placeholders replaced).
- Add a short walkthrough GIF or screenshots to the README header.
