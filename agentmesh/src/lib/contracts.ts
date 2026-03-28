/**
 * Client-side contract addresses and ABIs for Monad Testnet.
 * TaskEscrow now uses native MON — no ERC20 approval needed.
 */
import { parseEther } from "viem";

export const CONTRACTS = {
  AGENT_REGISTRY: "0xAd83441c289710001296bdE74f8f243FBAF89323" as `0x${string}`,
  TASK_ESCROW:    "0x05063844A0e23f1D1185b67b7A97A16761Ba2908" as `0x${string}`,
  REPUTATION:     "0x2b929B158E9b960cb8c0b7d4feafC11b7B065ADb" as `0x${string}`,
} as const;

/** Convert a human-readable MON amount to wei (18 decimals, same as ETH). */
export function toMonWei(amount: number): bigint {
  return parseEther(amount.toFixed(18).replace(/\.?0+$/, "") || "0");
}

// ─── ABIs ─────────────────────────────────────────────────────────────────────

export const AGENT_REGISTRY_ABI = [
  {
    name: "registerAgent",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "agentId",     type: "bytes32" },
      { name: "skills",      type: "string[]" },
      { name: "costPerTask", type: "uint256" },
      { name: "metadata",    type: "string" },
    ],
    outputs: [],
  },
  {
    name: "AgentRegistered",
    type: "event",
    inputs: [
      { indexed: true,  name: "agentId",     type: "bytes32" },
      { indexed: true,  name: "owner",       type: "address" },
      { indexed: false, name: "skills",      type: "string[]" },
      { indexed: false, name: "costPerTask", type: "uint256" },
    ],
  },
] as const;

export const TASK_ESCROW_ABI = [
  {
    name: "createTask",
    type: "function",
    stateMutability: "payable",   // ← sends native MON as msg.value
    inputs: [
      { name: "taskId", type: "bytes32" },
    ],
    outputs: [],
  },
  {
    name: "getTask",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "taskId", type: "bytes32" }],
    outputs: [
      { name: "depositor",      type: "address" },
      { name: "totalAmount",    type: "uint256" },
      { name: "releasedAmount", type: "uint256" },
      { name: "active",         type: "bool" },
      { name: "createdAt",      type: "uint256" },
    ],
  },
  {
    name: "TaskCreated",
    type: "event",
    inputs: [
      { indexed: true,  name: "taskId",    type: "bytes32" },
      { indexed: true,  name: "depositor", type: "address" },
      { indexed: false, name: "amount",    type: "uint256" },
    ],
  },
] as const;
