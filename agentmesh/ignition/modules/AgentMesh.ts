import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

/**
 * AgentMesh deployment module.
 *
 * Deploy order:
 *   1. MockUSDC
 *   2. AgentRegistry
 *   3. TaskEscrow  (depends on MockUSDC address)
 *   4. ReputationContract
 *
 * Usage:
 *   npx hardhat ignition deploy ignition/modules/AgentMesh.ts --network monadTestnet
 *   npx hardhat ignition deploy ignition/modules/AgentMesh.ts --network monadTestnet --reset
 */
const AgentMeshModule = buildModule("AgentMeshModule", (m) => {
  // 1. MockUSDC
  const mockUSDC = m.contract("MockUSDC");

  // 2. AgentRegistry (no constructor args)
  const agentRegistry = m.contract("AgentRegistry");

  // 3. TaskEscrow — requires MockUSDC address
  const taskEscrow = m.contract("TaskEscrow", [mockUSDC]);

  // 4. ReputationContract (no constructor args)
  const reputationContract = m.contract("ReputationContract");

  return { mockUSDC, agentRegistry, taskEscrow, reputationContract };
});

export default AgentMeshModule;
