// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title ReputationContract - On-chain reputation tracking for AI agents
contract ReputationContract {
    struct ReputationData {
        uint256 score;        // scaled x100 (e.g. 480 = 4.80 stars)
        uint256 totalTasks;
        uint256 successCount;
        uint256 lastUpdated;
    }

    mapping(bytes32 => ReputationData) public reputations;

    event ReputationUpdated(
        bytes32 indexed agentId,
        bool success,
        uint256 newScore,
        uint256 totalTasks
    );
    event ReputationInitialized(bytes32 indexed agentId, uint256 initialScore);

    /// @notice Initialize reputation for a newly registered agent
    function initializeReputation(bytes32 agentId, uint256 initialScore) external {
        require(reputations[agentId].lastUpdated == 0, "Already initialized");
        reputations[agentId] = ReputationData({
            score: initialScore,       // pass in scaled x100 (e.g. 480 for 4.80)
            totalTasks: 0,
            successCount: 0,
            lastUpdated: block.timestamp
        });
        emit ReputationInitialized(agentId, initialScore);
    }

    /// @notice Update agent reputation after task completion
    function updateReputation(bytes32 agentId, bool success) external {
        ReputationData storage r = reputations[agentId];
        r.totalTasks += 1;
        if (success) r.successCount += 1;

        if (r.totalTasks == 1) {
            r.score = success ? 480 : 100;
        } else {
            // New score = (old score * 0.8) + (task outcome * 0.2)
            // Success = 500, Failure = 100
            uint256 taskScore = success ? 500 : 100;
            r.score = (r.score * 80 + taskScore * 20) / 100;
        }

        r.lastUpdated = block.timestamp;
        emit ReputationUpdated(agentId, success, r.score, r.totalTasks);
    }

    /// @notice Get agent reputation data
    function getReputation(bytes32 agentId)
        external
        view
        returns (
            uint256 score,
            uint256 totalTasks,
            uint256 successCount,
            uint256 successRate  // percentage 0-100
        )
    {
        ReputationData storage r = reputations[agentId];
        uint256 rate = r.totalTasks > 0
            ? (r.successCount * 100) / r.totalTasks
            : 0;
        return (r.score, r.totalTasks, r.successCount, rate);
    }
}
