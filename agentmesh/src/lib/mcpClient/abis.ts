/**
 * Contract ABIs for AgentMesh on-chain interactions.
 * These match the Solidity contracts in /contracts/
 */

export const AGENT_REGISTRY_ABI = [
  {
    inputs: [
      { internalType: "bytes32", name: "agentId", type: "bytes32" },
      { internalType: "string[]", name: "skills", type: "string[]" },
      { internalType: "uint256", name: "costPerTask", type: "uint256" },
      { internalType: "string", name: "metadata", type: "string" },
    ],
    name: "registerAgent",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "bytes32", name: "agentId", type: "bytes32" }],
    name: "getAgent",
    outputs: [
      { internalType: "address", name: "owner", type: "address" },
      { internalType: "string[]", name: "skills", type: "string[]" },
      { internalType: "uint256", name: "costPerTask", type: "uint256" },
      { internalType: "string", name: "metadata", type: "string" },
      { internalType: "bool", name: "active", type: "bool" },
      { internalType: "uint256", name: "registeredAt", type: "uint256" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getAllAgentIds",
    outputs: [{ internalType: "bytes32[]", name: "", type: "bytes32[]" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "string", name: "skill", type: "string" }],
    name: "getAgentsBySkill",
    outputs: [{ internalType: "bytes32[]", name: "", type: "bytes32[]" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getTotalAgents",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "bytes32", name: "agentId", type: "bytes32" },
      { indexed: true, internalType: "address", name: "owner", type: "address" },
      { indexed: false, internalType: "string[]", name: "skills", type: "string[]" },
      { indexed: false, internalType: "uint256", name: "costPerTask", type: "uint256" },
    ],
    name: "AgentRegistered",
    type: "event",
  },
] as const;

export const TASK_ESCROW_ABI = [
  {
    inputs: [
      { internalType: "bytes32", name: "taskId", type: "bytes32" },
      { internalType: "uint256", name: "amount", type: "uint256" },
    ],
    name: "createTask",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "bytes32", name: "taskId", type: "bytes32" },
      { internalType: "bytes32", name: "subtaskId", type: "bytes32" },
      { internalType: "bytes32", name: "proofHash", type: "bytes32" },
    ],
    name: "submitProof",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "bytes32", name: "taskId", type: "bytes32" },
      { internalType: "bytes32", name: "subtaskId", type: "bytes32" },
      { internalType: "address", name: "agent", type: "address" },
      { internalType: "uint256", name: "amount", type: "uint256" },
    ],
    name: "approveWork",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "bytes32", name: "taskId", type: "bytes32" }],
    name: "refundRemaining",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "bytes32", name: "taskId", type: "bytes32" }],
    name: "getTask",
    outputs: [
      { internalType: "address", name: "depositor", type: "address" },
      { internalType: "uint256", name: "totalAmount", type: "uint256" },
      { internalType: "uint256", name: "releasedAmount", type: "uint256" },
      { internalType: "bool", name: "active", type: "bool" },
      { internalType: "uint256", name: "createdAt", type: "uint256" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "bytes32", name: "taskId", type: "bytes32" },
      { internalType: "bytes32", name: "subtaskId", type: "bytes32" },
    ],
    name: "getProof",
    outputs: [
      { internalType: "bytes32", name: "proofHash", type: "bytes32" },
      { internalType: "bool", name: "submitted", type: "bool" },
      { internalType: "bool", name: "approved", type: "bool" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "bytes32", name: "taskId", type: "bytes32" },
      { indexed: true, internalType: "address", name: "depositor", type: "address" },
      { indexed: false, internalType: "uint256", name: "amount", type: "uint256" },
    ],
    name: "TaskCreated",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "bytes32", name: "taskId", type: "bytes32" },
      { indexed: true, internalType: "bytes32", name: "subtaskId", type: "bytes32" },
      { indexed: false, internalType: "bytes32", name: "proofHash", type: "bytes32" },
    ],
    name: "ProofSubmitted",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "bytes32", name: "taskId", type: "bytes32" },
      { indexed: true, internalType: "bytes32", name: "subtaskId", type: "bytes32" },
      { indexed: true, internalType: "address", name: "agent", type: "address" },
      { indexed: false, internalType: "uint256", name: "amount", type: "uint256" },
    ],
    name: "WorkApproved",
    type: "event",
  },
] as const;

export const REPUTATION_ABI = [
  {
    inputs: [
      { internalType: "bytes32", name: "agentId", type: "bytes32" },
      { internalType: "uint256", name: "initialScore", type: "uint256" },
    ],
    name: "initializeReputation",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "bytes32", name: "agentId", type: "bytes32" },
      { internalType: "bool", name: "success", type: "bool" },
    ],
    name: "updateReputation",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "bytes32", name: "agentId", type: "bytes32" }],
    name: "getReputation",
    outputs: [
      { internalType: "uint256", name: "score", type: "uint256" },
      { internalType: "uint256", name: "totalTasks", type: "uint256" },
      { internalType: "uint256", name: "successCount", type: "uint256" },
      { internalType: "uint256", name: "successRate", type: "uint256" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "bytes32", name: "agentId", type: "bytes32" },
      { indexed: false, internalType: "bool", name: "success", type: "bool" },
      { indexed: false, internalType: "uint256", name: "newScore", type: "uint256" },
      { indexed: false, internalType: "uint256", name: "totalTasks", type: "uint256" },
    ],
    name: "ReputationUpdated",
    type: "event",
  },
] as const;

export const ERC20_ABI = [
  {
    inputs: [
      { internalType: "address", name: "spender", type: "address" },
      { internalType: "uint256", name: "amount", type: "uint256" },
    ],
    name: "approve",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "account", type: "address" }],
    name: "balanceOf",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "to", type: "address" },
      { internalType: "uint256", name: "amount", type: "uint256" },
    ],
    name: "mint",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const;
