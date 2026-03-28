/**
 * MCP Client — Service layer for all AgentMesh on-chain interactions.
 *
 * Wraps ethers.js v6 calls to AgentRegistry, TaskEscrow, and ReputationContract
 * on Monad testnet (or Hardhat localhost). All functions return { txHash, data, error }
 * so the UI can always display transaction hashes.
 *
 * If chain is not configured (missing env vars), functions log a warning and
 * return a simulated response — the app continues to work in "off-chain mode".
 */

import { ethers } from "ethers";
import {
  AGENT_REGISTRY_ABI,
  TASK_ESCROW_ABI,
  REPUTATION_ABI,
  ERC20_ABI,
} from "./abis";

// ─── Configuration ────────────────────────────────────────────────────────────

const RPC_URL =
  process.env.MONAD_RPC_URL ||
  process.env.HARDHAT_RPC_URL ||
  "http://127.0.0.1:8545";

const PRIVATE_KEY = process.env.DEPLOYER_PRIVATE_KEY || "";

const CONTRACT_ADDRESSES = {
  agentRegistry: process.env.AGENT_REGISTRY_ADDRESS || "",
  taskEscrow: process.env.TASK_ESCROW_ADDRESS || "",
  reputation: process.env.REPUTATION_ADDRESS || "",
  usdc: process.env.USDC_CONTRACT_ADDRESS || "",
};

// ─── Types ────────────────────────────────────────────────────────────────────

export interface McpResult<T = null> {
  txHash: string | null;
  data: T | null;
  error: string | null;
  onChain: boolean;
}

export interface OnChainAgent {
  agentId: string;   // bytes32 hex string
  owner: string;
  skills: string[];
  costPerTask: bigint;
  metadata: string;
  active: boolean;
}

export interface OnChainReputation {
  score: number;        // real (divide by 100)
  totalTasks: number;
  successCount: number;
  successRate: number;
}

// ─── Chain Availability ───────────────────────────────────────────────────────

function isChainConfigured(): boolean {
  return (
    PRIVATE_KEY.length > 0 &&
    CONTRACT_ADDRESSES.taskEscrow.length > 0
  );
}

let _provider: ethers.JsonRpcProvider | null = null;
let _wallet: ethers.Wallet | null = null;

function getProvider(): ethers.JsonRpcProvider {
  if (!_provider) {
    _provider = new ethers.JsonRpcProvider(RPC_URL);
  }
  return _provider;
}

function getWallet(): ethers.Wallet {
  if (!_wallet) {
    _wallet = new ethers.Wallet(PRIVATE_KEY, getProvider());
  }
  return _wallet;
}

function getRegistryContract() {
  return new ethers.Contract(
    CONTRACT_ADDRESSES.agentRegistry,
    AGENT_REGISTRY_ABI,
    getWallet()
  );
}

function getEscrowContract() {
  return new ethers.Contract(
    CONTRACT_ADDRESSES.taskEscrow,
    TASK_ESCROW_ABI,
    getWallet()
  );
}

function getReputationContract() {
  return new ethers.Contract(
    CONTRACT_ADDRESSES.reputation,
    REPUTATION_ABI,
    getWallet()
  );
}

function getUsdcContract() {
  return new ethers.Contract(
    CONTRACT_ADDRESSES.usdc,
    ERC20_ABI,
    getWallet()
  );
}

// ─── Retry Logic ──────────────────────────────────────────────────────────────

async function withRetry<T>(
  fn: () => Promise<T>,
  retries = 3,
  delayMs = 1000
): Promise<T> {
  let lastError: unknown;
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      if (i < retries - 1) {
        await new Promise((r) => setTimeout(r, delayMs * (i + 1)));
      }
    }
  }
  throw lastError;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Convert a string ID to bytes32 (left-padded hex) */
export function toBytes32(id: string): string {
  const hash = ethers.id(id); // keccak256 of string
  return hash;
}

/** Convert USDC amount (dollars) to wei units (6 decimals) */
function toUsdcUnits(amount: number): bigint {
  return BigInt(Math.floor(amount * 1_000_000));
}

function noChainResult<T>(msg = "Chain not configured — running in off-chain mode"): McpResult<T> {
  return { txHash: null, data: null, error: msg, onChain: false };
}

// ─── Agent Registry ──────────────────────────────────────────────────────────

/**
 * Register an AI agent on-chain in AgentRegistry.
 * Returns { txHash, data: { agentId } }
 */
export async function registerAgentOnChain(
  agentId: string,
  skills: string[],
  costPerTask: number,
  metadata: string
): Promise<McpResult<{ agentId: string }>> {
  if (!isChainConfigured()) {
    console.warn("[MCP] registerAgentOnChain: chain not configured");
    return noChainResult();
  }
  try {
    const registry = getRegistryContract();
    const agentIdBytes32 = toBytes32(agentId);
    const costUnits = toUsdcUnits(costPerTask);

    const tx = await withRetry(() =>
      registry.registerAgent(agentIdBytes32, skills, costUnits, metadata)
    );
    const receipt = await tx.wait();
    console.log(`[MCP] AgentRegistered txHash=${receipt.hash}`);
    return {
      txHash: receipt.hash,
      data: { agentId: agentIdBytes32 },
      error: null,
      onChain: true,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[MCP] registerAgentOnChain error:", msg);
    return { txHash: null, data: null, error: msg, onChain: false };
  }
}

/**
 * Fetch all registered agents from AgentRegistry.
 */
export async function fetchAgentsFromChain(): Promise<
  McpResult<OnChainAgent[]>
> {
  if (!isChainConfigured() || !CONTRACT_ADDRESSES.agentRegistry) {
    return noChainResult();
  }
  try {
    const registry = new ethers.Contract(
      CONTRACT_ADDRESSES.agentRegistry,
      AGENT_REGISTRY_ABI,
      getProvider()
    );
    const ids: string[] = await withRetry(() => registry.getAllAgentIds());
    const agents: OnChainAgent[] = [];

    for (const agentId of ids) {
      const result = await registry.getAgent(agentId);
      agents.push({
        agentId,
        owner: result[0],
        skills: result[1],
        costPerTask: result[2],
        metadata: result[3],
        active: result[4],
      });
    }

    return { txHash: null, data: agents, error: null, onChain: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[MCP] fetchAgentsFromChain error:", msg);
    return { txHash: null, data: null, error: msg, onChain: false };
  }
}

// ─── Task Escrow ──────────────────────────────────────────────────────────────

/**
 * Mint MockUSDC to deployer and approve escrow contract.
 * Only needed in local dev / testnet where we self-fund.
 */
async function ensureUsdcAllowance(amount: bigint): Promise<void> {
  const usdc = getUsdcContract();
  const escrowAddr = CONTRACT_ADDRESSES.taskEscrow;
  const walletAddr = await getWallet().getAddress();

  // Mint if needed (MockUSDC only)
  try {
    const balance: bigint = await usdc.balanceOf(walletAddr);
    if (balance < amount) {
      const mintTx = await usdc.mint(walletAddr, amount * 2n);
      await mintTx.wait();
    }
    // Approve escrow
    const approveTx = await usdc.approve(escrowAddr, amount);
    await approveTx.wait();
  } catch {
    // Not a MockUSDC — skip minting, just approve
    const approveTx = await usdc.approve(escrowAddr, amount);
    await approveTx.wait();
  }
}

/**
 * Create escrow for a task — locks USDC in TaskEscrow contract.
 * Returns { txHash }
 */
export async function createEscrowTask(
  taskId: string,
  amountUsdc: number
): Promise<McpResult<{ taskId: string; amountLocked: number }>> {
  if (!isChainConfigured()) {
    console.warn("[MCP] createEscrowTask: chain not configured");
    return noChainResult();
  }
  try {
    const escrow = getEscrowContract();
    const taskIdBytes32 = toBytes32(taskId);
    const amountUnits = toUsdcUnits(amountUsdc);

    await ensureUsdcAllowance(amountUnits);

    const tx = await withRetry(() =>
      escrow.createTask(taskIdBytes32, amountUnits)
    );
    const receipt = await tx.wait();
    console.log(`[MCP] TaskCreated txHash=${receipt.hash} amount=$${amountUsdc}`);
    return {
      txHash: receipt.hash,
      data: { taskId: taskIdBytes32, amountLocked: amountUsdc },
      error: null,
      onChain: true,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[MCP] createEscrowTask error:", msg);
    return { txHash: null, data: null, error: msg, onChain: false };
  }
}

/**
 * Submit proof of work for a subtask on-chain.
 * proofContent is hashed to bytes32 and stored.
 */
export async function submitProofOnChain(
  taskId: string,
  subtaskId: string,
  proofContent: string
): Promise<McpResult<{ proofHash: string }>> {
  if (!isChainConfigured()) {
    console.warn("[MCP] submitProofOnChain: chain not configured");
    return noChainResult();
  }
  try {
    const escrow = getEscrowContract();
    const taskIdBytes32 = toBytes32(taskId);
    const subtaskIdBytes32 = toBytes32(subtaskId);
    const proofHash = ethers.id(proofContent); // keccak256

    const tx = await withRetry(() =>
      escrow.submitProof(taskIdBytes32, subtaskIdBytes32, proofHash)
    );
    const receipt = await tx.wait();
    console.log(`[MCP] ProofSubmitted txHash=${receipt.hash}`);
    return {
      txHash: receipt.hash,
      data: { proofHash },
      error: null,
      onChain: true,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[MCP] submitProofOnChain error:", msg);
    return { txHash: null, data: null, error: msg, onChain: false };
  }
}

/**
 * Approve completed work and release payment from escrow to agent wallet.
 */
export async function approveWorkOnChain(
  taskId: string,
  subtaskId: string,
  agentWalletAddress: string,
  amountUsdc: number
): Promise<McpResult<{ released: number }>> {
  if (!isChainConfigured()) {
    console.warn("[MCP] approveWorkOnChain: chain not configured");
    return noChainResult();
  }
  try {
    const escrow = getEscrowContract();
    const taskIdBytes32 = toBytes32(taskId);
    const subtaskIdBytes32 = toBytes32(subtaskId);
    const amountUnits = toUsdcUnits(amountUsdc);

    const tx = await withRetry(() =>
      escrow.approveWork(
        taskIdBytes32,
        subtaskIdBytes32,
        agentWalletAddress,
        amountUnits
      )
    );
    const receipt = await tx.wait();
    console.log(
      `[MCP] WorkApproved txHash=${receipt.hash} amount=$${amountUsdc} agent=${agentWalletAddress}`
    );
    return {
      txHash: receipt.hash,
      data: { released: amountUsdc },
      error: null,
      onChain: true,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[MCP] approveWorkOnChain error:", msg);
    return { txHash: null, data: null, error: msg, onChain: false };
  }
}

/**
 * Refund remaining escrow balance back to depositor after task ends.
 */
export async function refundEscrowOnChain(
  taskId: string
): Promise<McpResult<null>> {
  if (!isChainConfigured()) {
    return noChainResult();
  }
  try {
    const escrow = getEscrowContract();
    const taskIdBytes32 = toBytes32(taskId);
    const tx = await withRetry(() => escrow.refundRemaining(taskIdBytes32));
    const receipt = await tx.wait();
    console.log(`[MCP] TaskRefunded txHash=${receipt.hash}`);
    return { txHash: receipt.hash, data: null, error: null, onChain: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[MCP] refundEscrowOnChain error:", msg);
    return { txHash: null, data: null, error: msg, onChain: false };
  }
}

// ─── Reputation ───────────────────────────────────────────────────────────────

/**
 * Initialize on-chain reputation for a newly registered agent.
 */
export async function initReputationOnChain(
  agentId: string,
  initialScore: number  // 0-5 stars
): Promise<McpResult<null>> {
  if (!isChainConfigured() || !CONTRACT_ADDRESSES.reputation) {
    return noChainResult();
  }
  try {
    const rep = getReputationContract();
    const agentIdBytes32 = toBytes32(agentId);
    const scaledScore = Math.floor(initialScore * 100);

    const tx = await withRetry(() =>
      rep.initializeReputation(agentIdBytes32, scaledScore)
    );
    const receipt = await tx.wait();
    console.log(`[MCP] ReputationInitialized txHash=${receipt.hash}`);
    return { txHash: receipt.hash, data: null, error: null, onChain: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[MCP] initReputationOnChain error:", msg);
    return { txHash: null, data: null, error: msg, onChain: false };
  }
}

/**
 * Update agent reputation after task completion.
 * This permanently records success/failure on-chain.
 */
export async function updateReputationOnChain(
  agentId: string,
  success: boolean
): Promise<McpResult<null>> {
  if (!isChainConfigured() || !CONTRACT_ADDRESSES.reputation) {
    return noChainResult();
  }
  try {
    const rep = getReputationContract();
    const agentIdBytes32 = toBytes32(agentId);

    const tx = await withRetry(() =>
      rep.updateReputation(agentIdBytes32, success)
    );
    const receipt = await tx.wait();
    console.log(
      `[MCP] ReputationUpdated txHash=${receipt.hash} success=${success}`
    );
    return { txHash: receipt.hash, data: null, error: null, onChain: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[MCP] updateReputationOnChain error:", msg);
    return { txHash: null, data: null, error: msg, onChain: false };
  }
}

/**
 * Fetch current reputation from chain.
 */
export async function getReputationFromChain(
  agentId: string
): Promise<McpResult<OnChainReputation>> {
  if (!isChainConfigured() || !CONTRACT_ADDRESSES.reputation) {
    return noChainResult();
  }
  try {
    const rep = new ethers.Contract(
      CONTRACT_ADDRESSES.reputation,
      REPUTATION_ABI,
      getProvider()
    );
    const agentIdBytes32 = toBytes32(agentId);
    const result = await rep.getReputation(agentIdBytes32);
    return {
      txHash: null,
      data: {
        score: Number(result[0]) / 100,
        totalTasks: Number(result[1]),
        successCount: Number(result[2]),
        successRate: Number(result[3]),
      },
      error: null,
      onChain: true,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { txHash: null, data: null, error: msg, onChain: false };
  }
}

/**
 * Check chain connectivity and contract deployment status.
 */
export async function getChainStatus(): Promise<{
  connected: boolean;
  network: string;
  blockNumber: number | null;
  contracts: Record<string, boolean>;
  walletAddress: string | null;
}> {
  try {
    const provider = getProvider();
    const network = await provider.getNetwork();
    const blockNumber = await provider.getBlockNumber();
    const walletAddress = PRIVATE_KEY ? await getWallet().getAddress() : null;

    const contractStatus: Record<string, boolean> = {};
    for (const [name, addr] of Object.entries(CONTRACT_ADDRESSES)) {
      if (!addr) {
        contractStatus[name] = false;
        continue;
      }
      const code = await provider.getCode(addr);
      contractStatus[name] = code !== "0x";
    }

    return {
      connected: true,
      network: network.name || `chainId:${network.chainId}`,
      blockNumber,
      contracts: contractStatus,
      walletAddress,
    };
  } catch {
    return {
      connected: false,
      network: "unknown",
      blockNumber: null,
      contracts: {},
      walletAddress: null,
    };
  }
}
