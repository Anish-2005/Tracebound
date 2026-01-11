import { ethers } from "ethers";

const defaultAbi = [
  "event WorkflowCreated(uint256 indexed workflowId, address indexed creator, bytes32 metadataHash, uint64 timestamp)",
  "event StepRecorded(uint256 indexed workflowId, string stepId, string agentName, uint8 status, bytes32 outputHash, uint64 timestamp)",
  "event WorkflowFinalized(uint256 indexed workflowId, uint8 status, uint64 timestamp)",
  "function createWorkflow(bytes32 metadataHash) returns (uint256)",
  "function recordStep(uint256 workflowId, string stepId, string agentName, uint8 status, bytes32 outputHash)",
  "function finalizeWorkflow(uint256 workflowId, uint8 finalStatus)"
];

const WorkflowStatus = {
  CREATED: 0,
  RUNNING: 1,
  COMPLETED: 2,
  FAILED: 3,
};

const StepStatus = {
  SUCCESS: 0,
  FAILURE: 1,
};

export class ContractClient {
  constructor({ rpcUrl, privateKey, contractAddress, abi = defaultAbi, enabled = true }) {
    this.enabled = enabled && Boolean(rpcUrl && privateKey && contractAddress);
    if (!this.enabled) {
      return;
    }
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const wallet = new ethers.Wallet(privateKey, provider);
    this.contract = new ethers.Contract(contractAddress, abi, wallet);
  }

  isEnabled() {
    return this.enabled && this.contract;
  }

  hashPayload(payload) {
    return ethers.keccak256(ethers.toUtf8Bytes(JSON.stringify(payload || {})));
  }

  async createWorkflow(instruction) {
    if (!this.isEnabled()) return { skipped: true };
    const tx = await this.contract.createWorkflow(this.hashPayload({ instruction }));
    const receipt = await tx.wait();
    const workflowId = this.#extractEventArg(receipt.logs, "WorkflowCreated", 0);
    return { workflowId, txHash: receipt.hash };
  }

  async logStep(workflowId, stepId, agentName, status, payload) {
    if (!this.isEnabled()) return { skipped: true };
    const payloadHash = this.hashPayload(payload);
    const statusCode = status === "success" ? StepStatus.SUCCESS : StepStatus.FAILURE;
    const tx = await this.contract.recordStep(workflowId, stepId, agentName, statusCode, payloadHash);
    const receipt = await tx.wait();
    return { txHash: receipt.hash };
  }

  async finalizeWorkflow(workflowId, success) {
    if (!this.isEnabled()) return { skipped: true };
    const finalStatus = success ? WorkflowStatus.COMPLETED : WorkflowStatus.FAILED;
    const tx = await this.contract.finalizeWorkflow(workflowId, finalStatus);
    const receipt = await tx.wait();
    return { txHash: receipt.hash };
  }

  #extractEventArg(logs, eventName, index) {
    for (const log of logs) {
      try {
        const parsed = this.contract.interface.parseLog(log);
        if (parsed?.name === eventName) {
          const value = parsed.args?.[index];
          return typeof value === "bigint" ? Number(value) : value;
        }
      } catch (_) {
        // ignore non-matching logs
      }
    }
    return null;
  }
}
