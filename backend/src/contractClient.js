import { ethers } from "ethers";

const defaultAbi = [
  "event WorkflowCreated(uint256 indexed workflowId, bytes32 indexed instructionHash, uint256 timestamp)",
  "event StepRecorded(uint256 indexed workflowId, string stepId, string status, uint256 timestamp, bytes32 payloadHash)",
  "event WorkflowFinalized(uint256 indexed workflowId, uint8 status, uint256 timestamp)",
  "function createWorkflow(bytes32 instructionHash) returns (uint256)",
  "function logStep(uint256 workflowId, string stepId, string status, bytes32 payloadHash)",
  "function finalizeWorkflow(uint256 workflowId, bool success)"
];

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

  hashInstruction(instruction) {
    return ethers.keccak256(ethers.toUtf8Bytes(instruction || ""));
  }

  hashPayload(payload) {
    return ethers.keccak256(ethers.toUtf8Bytes(JSON.stringify(payload || {})));
  }

  async createWorkflow(instruction) {
    if (!this.isEnabled()) return { skipped: true };
    const tx = await this.contract.createWorkflow(this.hashInstruction(instruction));
    const receipt = await tx.wait();
    const workflowId = this.#extractEventArg(receipt.logs, "WorkflowCreated", 0);
    return { workflowId, txHash: receipt.hash };
  }

  async logStep(workflowId, stepId, status, payload) {
    if (!this.isEnabled()) return { skipped: true };
    const payloadHash = this.hashPayload(payload);
    const tx = await this.contract.logStep(workflowId, stepId, status, payloadHash);
    const receipt = await tx.wait();
    return { txHash: receipt.hash };
  }

  async finalizeWorkflow(workflowId, success) {
    if (!this.isEnabled()) return { skipped: true };
    const tx = await this.contract.finalizeWorkflow(workflowId, success);
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
