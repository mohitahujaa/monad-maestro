/**
 * Deploy AgentMesh contracts to Hardhat localhost OR Monad testnet.
 *
 * Deploys:
 *   1. MockUSDC
 *   2. AgentRegistry
 *   3. TaskEscrow
 *   4. ReputationContract
 *
 * Appends all contract addresses to .env after deployment.
 *
 * Usage:
 *   npx hardhat run scripts/deploy.ts --network localhost
 *   npx hardhat run scripts/deploy.ts --network monadTestnet
 */

import { network } from "hardhat";
import * as fs from "fs";

const { ethers } = await network.connect();

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with:", deployer.address);
  console.log(
    "Balance:",
    ethers.formatEther(await ethers.provider.getBalance(deployer.address)),
    "ETH/MON"
  );

  // ── 1. MockUSDC ────────────────────────────────────────────────────────
  console.log("\n1. Deploying MockUSDC...");
  const MockUSDC = await ethers.getContractFactory("MockUSDC");
  const usdc = await MockUSDC.deploy();
  await usdc.waitForDeployment();
  const usdcAddress = await usdc.getAddress();
  console.log("   MockUSDC:", usdcAddress);

  // ── 2. AgentRegistry ───────────────────────────────────────────────────
  console.log("2. Deploying AgentRegistry...");
  const AgentRegistry = await ethers.getContractFactory("AgentRegistry");
  const registry = await AgentRegistry.deploy();
  await registry.waitForDeployment();
  const registryAddress = await registry.getAddress();
  console.log("   AgentRegistry:", registryAddress);

  // ── 3. TaskEscrow ──────────────────────────────────────────────────────
  console.log("3. Deploying TaskEscrow...");
  const TaskEscrow = await ethers.getContractFactory("TaskEscrow");
  const escrow = await TaskEscrow.deploy(usdcAddress);
  await escrow.waitForDeployment();
  const escrowAddress = await escrow.getAddress();
  console.log("   TaskEscrow:", escrowAddress);

  // ── 4. ReputationContract ──────────────────────────────────────────────
  console.log("4. Deploying ReputationContract...");
  const ReputationContract = await ethers.getContractFactory("ReputationContract");
  const reputation = await ReputationContract.deploy();
  await reputation.waitForDeployment();
  const reputationAddress = await reputation.getAddress();
  console.log("   ReputationContract:", reputationAddress);

  // ── Write to .env ──────────────────────────────────────────────────────
  const envLine = `
# ── Deployed Contracts (${new Date().toISOString()}) ──
USDC_CONTRACT_ADDRESS=${usdcAddress}
AGENT_REGISTRY_ADDRESS=${registryAddress}
TASK_ESCROW_ADDRESS=${escrowAddress}
REPUTATION_ADDRESS=${reputationAddress}
`;

  fs.appendFileSync(".env", envLine);
  console.log("\n✓ Contract addresses written to .env");
  console.log("\n=== Summary ===");
  console.log("USDC_CONTRACT_ADDRESS=", usdcAddress);
  console.log("AGENT_REGISTRY_ADDRESS=", registryAddress);
  console.log("TASK_ESCROW_ADDRESS=", escrowAddress);
  console.log("REPUTATION_ADDRESS=", reputationAddress);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
