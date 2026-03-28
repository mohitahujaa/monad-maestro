// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/// @title TaskEscrow - Manages escrow, proof submission, and payment release for AgentMesh tasks
contract TaskEscrow {
    using SafeERC20 for IERC20;

    IERC20 public usdc;

    struct TaskEscrowData {
        address depositor;
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
    // taskId => subtaskId => proof
    mapping(bytes32 => mapping(bytes32 => ProofRecord)) public proofs;

    event TaskCreated(bytes32 indexed taskId, address indexed depositor, uint256 amount);
    event ProofSubmitted(bytes32 indexed taskId, bytes32 indexed subtaskId, bytes32 proofHash);
    event WorkApproved(
        bytes32 indexed taskId,
        bytes32 indexed subtaskId,
        address indexed agent,
        uint256 amount
    );
    event TaskRefunded(bytes32 indexed taskId, address depositor, uint256 amount);
    event TaskCompleted(bytes32 indexed taskId, uint256 totalReleased);

    constructor(address _usdc) {
        usdc = IERC20(_usdc);
    }

    /// @notice Deposit USDC into escrow for a task. Requires prior ERC20 approval.
    function createTask(bytes32 taskId, uint256 amount) external {
        require(!tasks[taskId].active, "Task already exists");
        require(amount > 0, "Amount must be > 0");
        usdc.safeTransferFrom(msg.sender, address(this), amount);
        tasks[taskId] = TaskEscrowData({
            depositor: msg.sender,
            totalAmount: amount,
            releasedAmount: 0,
            active: true,
            createdAt: block.timestamp
        });
        emit TaskCreated(taskId, msg.sender, amount);
    }

    /// @notice Submit proof of work for a subtask (called by agent or orchestrator)
    function submitProof(
        bytes32 taskId,
        bytes32 subtaskId,
        bytes32 proofHash
    ) external {
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

    /// @notice Approve subtask work and release payment to agent
    function approveWork(
        bytes32 taskId,
        bytes32 subtaskId,
        address agent,
        uint256 amount
    ) external {
        TaskEscrowData storage t = tasks[taskId];
        require(t.active, "Task not active");
        require(t.depositor == msg.sender, "Not task depositor");
        require(proofs[taskId][subtaskId].submitted, "Proof not submitted");
        require(!proofs[taskId][subtaskId].approved, "Already approved");
        require(t.releasedAmount + amount <= t.totalAmount, "Exceeds escrow balance");

        proofs[taskId][subtaskId].approved = true;
        t.releasedAmount += amount;
        usdc.safeTransfer(agent, amount);

        emit WorkApproved(taskId, subtaskId, agent, amount);
    }

    /// @notice Refund remaining balance after task completion or cancellation
    function refundRemaining(bytes32 taskId) external {
        TaskEscrowData storage t = tasks[taskId];
        require(t.active, "Task not active");
        require(msg.sender == t.depositor, "Not depositor");
        uint256 remaining = t.totalAmount - t.releasedAmount;
        t.active = false;
        if (remaining > 0) {
            usdc.safeTransfer(t.depositor, remaining);
        }
        emit TaskRefunded(taskId, t.depositor, remaining);
        emit TaskCompleted(taskId, t.releasedAmount);
    }

    /// @notice Get task escrow state
    function getTask(bytes32 taskId)
        external
        view
        returns (
            address depositor,
            uint256 totalAmount,
            uint256 releasedAmount,
            bool active,
            uint256 createdAt
        )
    {
        TaskEscrowData storage t = tasks[taskId];
        return (t.depositor, t.totalAmount, t.releasedAmount, t.active, t.createdAt);
    }

    /// @notice Get proof state for a subtask
    function getProof(bytes32 taskId, bytes32 subtaskId)
        external
        view
        returns (bytes32 proofHash, bool submitted, bool approved)
    {
        ProofRecord storage p = proofs[taskId][subtaskId];
        return (p.proofHash, p.submitted, p.approved);
    }
}
