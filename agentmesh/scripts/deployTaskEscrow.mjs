/**
 * Direct deploy script for the new native-MON TaskEscrow contract.
 * Run with: node scripts/deployTaskEscrow.mjs
 */
import { ethers } from "ethers";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import * as dotenv from "dotenv";

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(__dirname, "../.env") });

// Read compiled artifact
const artifactPath = resolve(__dirname, "../artifacts/contracts/TaskEscrow.sol/TaskEscrow.json");
const artifact = JSON.parse(readFileSync(artifactPath, "utf-8"));

const RPC_URL = process.env.MONAD_RPC_URL || "https://monad-testnet.drpc.org";
const PRIVATE_KEY = process.env.DEPLOYER_PRIVATE_KEY;

if (!PRIVATE_KEY) {
  console.error("❌  DEPLOYER_PRIVATE_KEY not set in .env");
  process.exit(1);
}

const provider = new ethers.JsonRpcProvider(RPC_URL);
const wallet   = new ethers.Wallet(PRIVATE_KEY, provider);

console.log(`\n🚀  Deploying TaskEscrow (native MON) to Monad Testnet`);
console.log(`   Deployer: ${wallet.address}`);

const balance = await provider.getBalance(wallet.address);
console.log(`   Balance:  ${ethers.formatEther(balance)} MON\n`);

const factory = new ethers.ContractFactory(artifact.abi, artifact.bytecode, wallet);
const contract = await factory.deploy({ gasLimit: 3_000_000n });
await contract.waitForDeployment();

const address = await contract.getAddress();
const deployTx = contract.deploymentTransaction();

console.log(`✅  TaskEscrow deployed!`);
console.log(`   Address: ${address}`);
console.log(`   Tx hash: ${deployTx?.hash}`);
console.log(`   Explorer: https://testnet.monadexplorer.com/address/${address}`);
console.log(`\n📝  Update your .env:`);
console.log(`   TASK_ESCROW_ADDRESS=${address}`);
console.log(`   ESCROW_CONTRACT_ADDRESS=${address}`);
