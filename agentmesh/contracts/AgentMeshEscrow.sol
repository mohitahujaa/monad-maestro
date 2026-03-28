// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract AgentMeshEscrow {
    using SafeERC20 for IERC20;

    IERC20 public usdc;

    struct TaskEscrow {
        address depositor;
        uint256 totalAmount;
        uint256 releasedAmount;
        bool active;
    }

    mapping(bytes32 => TaskEscrow) public tasks;

    event TaskDeposited(
        bytes32 indexed taskId,
        address depositor,
        uint256 amount
    );
    event PaymentReleased(
        bytes32 indexed taskId,
        bytes32 subtaskId,
        address agent,
        uint256 amount
    );
    event TaskRefunded(
        bytes32 indexed taskId,
        address depositor,
        uint256 amount
    );

    constructor(address _usdc) {
        usdc = IERC20(_usdc);
    }

    function depositTask(bytes32 taskId, uint256 amount) external {
        require(!tasks[taskId].active, "Task already exists");
        usdc.safeTransferFrom(msg.sender, address(this), amount);
        tasks[taskId] = TaskEscrow(msg.sender, amount, 0, true);
        emit TaskDeposited(taskId, msg.sender, amount);
    }

    function releasePayment(
        bytes32 taskId,
        bytes32 subtaskId,
        address agent,
        uint256 amount
    ) external {
        TaskEscrow storage t = tasks[taskId];
        require(t.active, "Task not active");
        require(
            t.releasedAmount + amount <= t.totalAmount,
            "Exceeds escrow"
        );
        t.releasedAmount += amount;
        usdc.safeTransfer(agent, amount);
        emit PaymentReleased(taskId, subtaskId, agent, amount);
    }

    function refundRemaining(bytes32 taskId) external {
        TaskEscrow storage t = tasks[taskId];
        require(t.active, "Task not active");
        require(msg.sender == t.depositor, "Not depositor");
        uint256 remaining = t.totalAmount - t.releasedAmount;
        t.active = false;
        if (remaining > 0) usdc.safeTransfer(t.depositor, remaining);
        emit TaskRefunded(taskId, t.depositor, remaining);
    }
}
