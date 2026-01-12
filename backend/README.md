# Backend — Tracebound

Purpose
- The backend contains the API server and the agent framework that orchestrates workflows. It receives intents, parses and validates them, coordinates agents to execute workflow steps, records step-level events to the smart contracts, and exposes APIs that the frontend consumes for live trace updates.

Key responsibilities
- Parse incoming intents into ordered workflow JSON and actionable steps.
- Validate intents against policy rules before and during execution.
- Orchestrate agents that carry out actions, handle branching logic, and emit step results.
- Persist audit entries and call deployed contracts to record verifiable step proofs.
- Serve an HTTP API used by the frontend for previews, execution control, and timeline streaming.

Important files & folders
- `src/` — main server and agent implementations.
  - `src/workflow.js` — core orchestration logic and step runner.
  - `src/contractClient.js` — helpers for interacting with deployed contracts.
  - `src/agents/` — agent implementations (intent parser, policy check, external-service agent, audit logger, etc.).
- `scripts/` — deployment and utility scripts for contracts.
- `contracts/` — local contract sources used during development and tests (also compiled via Hardhat).

Quickstart (local)
```powershell
cd backend
npm install

# Start local Hardhat node
npx hardhat node

# Deploy contracts to the local node
node scripts/deploy.js

# Start backend server (exposes API + runs agents)
node src/server.js
```

Environment variables
- Copy `.env.example` → `.env` and set the following as needed:
  - `RPC_URL` — RPC endpoint for the EVM node (e.g., http://127.0.0.1:8545)
  - `PRIVATE_KEY` — key used for contract transactions in local/dev
  - `CONTRACT_ADDRESS` — deployed IntentLedger contract address (after deploy)
  - `ENABLE_ONCHAIN` — enable/disable contract writes (true/false)

Testing
- Run contract tests and backend tests using Hardhat and npm scripts:
```powershell
cd backend
npm test
```

Developer notes
- The agent framework is modular: add or swap agents under `src/agents` to extend behavior.
- Use the `contractClient` helpers to read/write contract state and to listen for events used by the frontend.
