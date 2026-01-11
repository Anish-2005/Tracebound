// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title IntentLedger - Minimal on-chain audit log for agentic workflows
/// @notice Designed for hackathon use: favor readability, low gas, and explicit states.
contract IntentLedger {
    enum WorkflowStatus {
        CREATED,
        RUNNING,
        COMPLETED,
        FAILED
    }

    enum StepStatus {
        SUCCESS,
        FAILURE
    }

    struct Workflow {
        address creator;
        bytes32 metadataHash; // off-chain workflow/intent hash
        WorkflowStatus status;
        uint64 createdAt;
        uint64 updatedAt;
    }

    struct StepLog {
        string stepId;
        string agentName;
        StepStatus status;
        bytes32 outputHash; // hash of off-chain step output for auditability
        uint64 timestamp;
    }

    uint256 private _nextWorkflowId = 1;
    mapping(uint256 => Workflow) public workflows;
    mapping(uint256 => StepLog[]) private _stepLogs;

    event WorkflowCreated(uint256 indexed workflowId, address indexed creator, bytes32 metadataHash, uint64 timestamp);
    event StepRecorded(
        uint256 indexed workflowId,
        string stepId,
        string agentName,
        StepStatus status,
        bytes32 outputHash,
        uint64 timestamp
    );
    event WorkflowFinalized(uint256 indexed workflowId, WorkflowStatus status, uint64 timestamp);

    /// @notice Create a new workflow record. Status is set to RUNNING so steps can be appended immediately.
    function createWorkflow(bytes32 metadataHash) external returns (uint256 workflowId) {
        workflowId = _nextWorkflowId++;
        workflows[workflowId] = Workflow({
            creator: msg.sender,
            metadataHash: metadataHash,
            status: WorkflowStatus.RUNNING,
            createdAt: uint64(block.timestamp),
            updatedAt: uint64(block.timestamp)
        });
        emit WorkflowCreated(workflowId, msg.sender, metadataHash, uint64(block.timestamp));
    }

    /// @notice Append a step execution log while workflow is RUNNING.
    function recordStep(
        uint256 workflowId,
        string calldata stepId,
        string calldata agentName,
        StepStatus status,
        bytes32 outputHash
    ) external {
        Workflow storage wf = workflows[workflowId];
        require(wf.status == WorkflowStatus.RUNNING, "workflow not running");

        _stepLogs[workflowId].push(
            StepLog({
                stepId: stepId,
                agentName: agentName,
                status: status,
                outputHash: outputHash,
                timestamp: uint64(block.timestamp)
            })
        );

        wf.updatedAt = uint64(block.timestamp);
        emit StepRecorded(workflowId, stepId, agentName, status, outputHash, uint64(block.timestamp));
    }

    /// @notice Finalize a workflow; once finalized it cannot be reopened.
    /// @param finalStatus Must be COMPLETED or FAILED.
    function finalizeWorkflow(uint256 workflowId, WorkflowStatus finalStatus) external {
        Workflow storage wf = workflows[workflowId];
        require(wf.status == WorkflowStatus.RUNNING, "workflow closed");
        require(
            finalStatus == WorkflowStatus.COMPLETED || finalStatus == WorkflowStatus.FAILED,
            "invalid final status"
        );

        wf.status = finalStatus;
        wf.updatedAt = uint64(block.timestamp);
        emit WorkflowFinalized(workflowId, finalStatus, uint64(block.timestamp));
    }

    /// @notice Helper to fetch step logs for off-chain consumers.
    function getStepLogs(uint256 workflowId) external view returns (StepLog[] memory) {
        return _stepLogs[workflowId];
    }
}
