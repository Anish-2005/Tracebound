# Contracts — Tracebound

Purpose
- This folder contains the Solidity smart contracts that provide immutable recording of workflow events and proofs. Contracts capture workflow metadata, per-step logs, and final execution state so traces can be independently verified on-chain.

Key contracts
- `IntentLedger.sol` — primary contract for recording workflow creation, per-step logs, and final outcome.
- `WorkflowAudit.sol` — supplementary auditing utilities and helpers used by the system.

Development & testing
- This repository uses Hardhat for compilation, testing, and local deployments. Compiled artifacts and build info are available in the `artifacts` directory when you run the Hardhat build.

Quickstart (compile & test)
```powershell
cd backend
npm install

# Compile contracts
npx hardhat compile

# Run tests
npx hardhat test
```

Deployment
- Use the scripts in `backend/scripts` to deploy contracts to a local or remote network. After deploy, update the backend `.env` with the deployed `CONTRACT_ADDRESS` used by the agents and server.

Developer notes
- Contract ABIs and addresses are used by `backend/src/contractClient.js` to submit step logs and read stored proofs.
- Keep contracts under `backend/contracts` in sync with this folder if you modify sources for Hardhat runs.
