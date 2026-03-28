import { defineConfig } from "hardhat/config";
import hardhatToolboxMochaEthersPlugin from "@nomicfoundation/hardhat-toolbox-mocha-ethers";
import hardhatIgnitionEthers from "@nomicfoundation/hardhat-ignition-ethers";
import * as dotenv from "dotenv";
dotenv.config();

export default defineConfig({
  plugins: [hardhatToolboxMochaEthersPlugin, hardhatIgnitionEthers],
  solidity: {
    version: "0.8.28",
    settings: {
      evmVersion: "prague",
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    localhost: {
      type: "http",
      url: "http://127.0.0.1:8545",
      chainId: 31337,
    },
    monadTestnet: {
      type: "http",
      url: process.env.MONAD_RPC_URL || "https://monad-testnet.drpc.org",
      chainId: 10143,
      accounts: process.env.DEPLOYER_PRIVATE_KEY
        ? [process.env.DEPLOYER_PRIVATE_KEY]
        : [],
    },
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
  },
});
