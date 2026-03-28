// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title TaskEscrow — Escrow using native MON token (not ERC20)
contract TaskEscrow {
    struct TaskEscrowData {
        address payable depositor;
        uint256 totalAmount;
        uint256 releasedAmount;
        bool active;
        uint256 createdAt;
    }

    struct ProofRecord {
        bytes32 proofHash;
        bool submitted;
        bool approved;
        uint256 submittedAt;
    }

    mapping(bytes32 => TaskEscrowData) public tasks;
    mapping(bytes32 => mapping(bytes32 => ProofRecord)) public proofs;

    event TaskCreated(bytes32 indexed taskId, address indexed depositor, uint256 amount);
    event ProofSubmitted(bytes32 indexed taskId, bytes32 indexed subtaskId, bytes32 proofHash);
    event WorkApproved(bytes32 indexed taskId, bytes32 indexed subtaskId, address indexed agent, uint256 amount);
    event TaskRefunded(bytes32 indexed taskId, address depositor, uint256 amount);
    event TaskCompleted(bytes32 indexed taskId, uint256 totalReleased);

    /// @notice Lock MON in escrow. Send MON as msg.value.
    function createTask(bytes32 taskId) external payable {
        require(!tasks[taskId].active, "Task already exists");
        require(msg.value > 0, "Must send MON");
        tasks[taskId] = TaskEscrowData({
            depositor: payable(msg.sender),
            totalAmount: msg.value,
            releasedAmount: 0,
            active: true,
            createdAt: block.timestamp
        });
        emit TaskCreated(taskId, msg.sender, msg.value);
    }

    /// @notice Submit proof of work for a subtask (called by agent/orchestrator)
    function submitProof(bytes32 taskId, bytes32 subtaskId, bytes32 proofHash) external {
        require(tasks[taskId].active, "Task not active");
        require(!proofs[taskId][subtaskId].submitted, "Proof already submitted");
        proofs[taskId][subtaskId] = ProofRecord({
            proofHash: proofHash,
            submitted: true,
            approved: false,
            submittedAt: block.timestamp
        });
        emit ProofSubmitted(taskId, subtaskId, proofHash);
    }

    /// @notice Approve work and release MON to agent
    function approveWork(bytes32 taskId, bytes32 subtaskId, address payable agent, uint256 amount) external {
        TaskEscrowData storage t = tasks[taskId];
        require(t.active, "Task not active");
        require(t.depositor == msg.sender, "Not depositor");
        require(proofs[taskId][subtaskId].submitted, "Proof not submitted");
        require(!proofs[taskId][subtaskId].approved, "Already approved");
        require(t.releasedAmount + amount <= t.totalAmount, "Exceeds escrow");

        proofs[taskId][subtaskId].approved = true;
        t.releasedAmount += amount;
        (bool ok,) = agent.call{value: amount}("");
        require(ok, "MON transfer failed");
        emit WorkApproved(taskId, subtaskId, agent, amount);
    }

    /// @notice Refund remaining MON to depositor
    function refundRemaining(bytes32 taskId) external {
        TaskEscrowData storage t = tasks[taskId];
        require(t.active, "Task not active");
        require(msg.sender == t.depositor, "Not depositor");
        uint256 remaining = t.totalAmount - t.releasedAmount;
        t.active = false;
        if (remaining > 0) {
            (bool ok,) = t.depositor.call{value: remaining}("");
            require(ok, "Refund failed");
        }
        emit TaskRefunded(taskId, t.depositor, remaining);
        emit TaskCompleted(taskId, t.releasedAmount);
    }

    function getTask(bytes32 taskId) external view returns (
        address depositor, uint256 totalAmount, uint256 releasedAmount, bool active, uint256 createdAt
    ) {
        TaskEscrowData storage t = tasks[taskId];
        return (t.depositor, t.totalAmount, t.releasedAmount, t.active, t.createdAt);
    }

    function getProof(bytes32 taskId, bytes32 subtaskId) external view returns (
        bytes32 proofHash, bool submitted, bool approved
    ) {
        ProofRecord storage p = proofs[taskId][subtaskId];
        return (p.proofHash, p.submitted, p.approved);
    }

    receive() external payable {}
}
