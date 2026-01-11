// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title WorkflowAudit - Minimal on-chain audit log for agentic workflows
/// @notice Designed for hackathon use: simple, readable, and focused on traceability.
contract WorkflowAudit {
    enum WorkflowStatus {
        Pending,
        Running,
        Failed,
        Completed
    }

    struct Workflow {
        bytes32 instructionHash;
        WorkflowStatus status;
        uint256 startedAt;
        uint256 endedAt;
    }

    struct StepLog {
        string stepId;
        string status; // e.g., "success" | "failure"
        uint256 timestamp;
        bytes32 payloadHash; // hash of off-chain data for auditability
    }

    uint256 private _nextWorkflowId = 1;
    mapping(uint256 => Workflow) public workflows;
    mapping(uint256 => StepLog[]) private _stepLogs;

    event WorkflowCreated(uint256 indexed workflowId, bytes32 indexed instructionHash, uint256 timestamp);
    event StepRecorded(uint256 indexed workflowId, string stepId, string status, uint256 timestamp, bytes32 payloadHash);
    event WorkflowFinalized(uint256 indexed workflowId, WorkflowStatus status, uint256 timestamp);

    /// @notice Create a new workflow record; caller supplies instruction hash to avoid storing long text.
    function createWorkflow(bytes32 instructionHash) external returns (uint256 workflowId) {
        workflowId = _nextWorkflowId++;
        workflows[workflowId] = Workflow({
            instructionHash: instructionHash,
            status: WorkflowStatus.Running,
            startedAt: block.timestamp,
            endedAt: 0
        });
        emit WorkflowCreated(workflowId, instructionHash, block.timestamp);
    }

    /// @notice Append a step execution log.
    function logStep(
        uint256 workflowId,
        string calldata stepId,
        string calldata status,
        bytes32 payloadHash
    ) external {
        Workflow storage wf = workflows[workflowId];
        require(wf.startedAt != 0, "workflow: missing");
        require(wf.status == WorkflowStatus.Running, "workflow: not running");

        _stepLogs[workflowId].push(
            StepLog({
                stepId: stepId,
                status: status,
                timestamp: block.timestamp,
                payloadHash: payloadHash
            })
        );

        emit StepRecorded(workflowId, stepId, status, block.timestamp, payloadHash);

        if (keccak256(bytes(status)) == keccak256(bytes("failure"))) {
            wf.status = WorkflowStatus.Failed;
            wf.endedAt = block.timestamp;
            emit WorkflowFinalized(workflowId, wf.status, block.timestamp);
        }
    }

    /// @notice Finalize workflow with explicit status; only callable while running.
    function finalizeWorkflow(uint256 workflowId, bool success) external {
        Workflow storage wf = workflows[workflowId];
        require(wf.startedAt != 0, "workflow: missing");
        require(wf.status == WorkflowStatus.Running, "workflow: closed");

        wf.status = success ? WorkflowStatus.Completed : WorkflowStatus.Failed;
        wf.endedAt = block.timestamp;
        emit WorkflowFinalized(workflowId, wf.status, block.timestamp);
    }

    /// @notice View helper to fetch step logs.
    function getStepLogs(uint256 workflowId) external view returns (StepLog[] memory) {
        return _stepLogs[workflowId];
    }
}
