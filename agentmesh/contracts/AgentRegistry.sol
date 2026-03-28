// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title AgentRegistry - On-chain registry for AI agents in AgentMesh
contract AgentRegistry {
    struct Agent {
        address owner;
        string[] skills;
        uint256 costPerTask; // in USDC micro-units (6 decimals)
        string metadata;     // JSON: name, description, domain
        bool active;
        uint256 registeredAt;
    }

    mapping(bytes32 => Agent) public agents;
    bytes32[] public agentIds;
    mapping(string => bytes32[]) public skillToAgents;

    event AgentRegistered(
        bytes32 indexed agentId,
        address indexed owner,
        string[] skills,
        uint256 costPerTask
    );
    event AgentDeactivated(bytes32 indexed agentId);
    event AgentUpdated(bytes32 indexed agentId, uint256 newCost);

    modifier onlyAgentOwner(bytes32 agentId) {
        require(agents[agentId].owner == msg.sender, "Not agent owner");
        _;
    }

    function registerAgent(
        bytes32 agentId,
        string[] calldata skills,
        uint256 costPerTask,
        string calldata metadata
    ) external {
        require(!agents[agentId].active, "Agent already registered");
        require(skills.length > 0, "Must have at least one skill");

        agents[agentId] = Agent({
            owner: msg.sender,
            skills: skills,
            costPerTask: costPerTask,
            metadata: metadata,
            active: true,
            registeredAt: block.timestamp
        });
        agentIds.push(agentId);

        for (uint256 i = 0; i < skills.length; i++) {
            skillToAgents[skills[i]].push(agentId);
        }

        emit AgentRegistered(agentId, msg.sender, skills, costPerTask);
    }

    function getAgent(bytes32 agentId)
        external
        view
        returns (
            address owner,
            string[] memory skills,
            uint256 costPerTask,
            string memory metadata,
            bool active,
            uint256 registeredAt
        )
    {
        Agent storage a = agents[agentId];
        return (a.owner, a.skills, a.costPerTask, a.metadata, a.active, a.registeredAt);
    }

    function getAllAgentIds() external view returns (bytes32[] memory) {
        return agentIds;
    }

    function getAgentsBySkill(string calldata skill) external view returns (bytes32[] memory) {
        return skillToAgents[skill];
    }

    function deactivateAgent(bytes32 agentId) external onlyAgentOwner(agentId) {
        agents[agentId].active = false;
        emit AgentDeactivated(agentId);
    }

    function updateCost(bytes32 agentId, uint256 newCost) external onlyAgentOwner(agentId) {
        agents[agentId].costPerTask = newCost;
        emit AgentUpdated(agentId, newCost);
    }

    function getTotalAgents() external view returns (uint256) {
        return agentIds.length;
    }
}
