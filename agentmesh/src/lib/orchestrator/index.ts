/**
 * AgentMesh Orchestrator
 *
 * Off-chain orchestration engine that:
 * 1. Plans tasks using LLM (Groq)
 * 2. Scores and selects agents
 * 3. Builds execution DAG
 * 4. Creates on-chain escrow via MCP
 * 5. Executes subtasks with worker agents
 * 6. Submits proofs and approves payments on-chain via MCP
 * 7. Updates reputation on-chain via MCP
 * 8. Runs supervisor agent to monitor execution
 */

import { planTask } from "@/lib/planner";
import { runWorker } from "@/lib/worker";
import { runSupervisor } from "@/lib/supervisor";
import { validateProof } from "@/lib/proof-validator";
import {
  createEscrowTask,
  submitProofOnChain,
  approveWorkOnChain,
  updateReputationOnChain,
  refundEscrowOnChain,
} from "@/lib/mcpClient";
import { buildDAG } from "./dag";
import { selectAgentsForPlan } from "./scoring";
import {
  store,
  addLog,
  addAlert,
  addTxRecord,
  updateTask,
  updateSubtask,
  getAllAgents,
  getTask,
  Task,
  Subtask,
  SelectedAgent,
} from "@/lib/store/inMemoryStore";

// ─── Planner ──────────────────────────────────────────────────────────────────

/**
 * Plan a task: call LLM planner, build DAG, select agents.
 * Returns the updated task with planJson, DAG levels, and selectedAgents.
 */
export async function orchestratePlan(
  taskId: string
): Promise<Task | null> {
  const task = getTask(taskId);
  if (!task) return null;

  addLog(taskId, "info", "Planner Agent: decomposing task into subtasks...");

  const perAgentLimits = task.guardrail.perAgentLimits;

  // ── Step 1: LLM Planning ────────────────────────────────────────────────
  const plan = await planTask(
    task.title,
    task.description,
    task.totalBudget,
    perAgentLimits
  );

  addLog(
    taskId,
    "info",
    `Plan created: ${plan.subtasks.length} subtasks, est. $${plan.total_estimated_cost} USDC`
  );

  // ── Step 2: Build DAG ───────────────────────────────────────────────────
  const dag = buildDAG(plan.subtasks);
  const dagLevels = dag.levels; // subtask plan IDs grouped by level

  addLog(
    taskId,
    "info",
    `DAG built: ${dag.levels.length} execution levels, max parallelism: ${dag.estimatedParallelism}`
  );

  // ── Step 3: Agent Selection (Scoring) ───────────────────────────────────
  const agents = getAllAgents();
  const subtaskDomains = plan.subtasks.map((st) => ({
    subtaskId: st.id,
    domain: st.assigned_agent_domain,
    budget: perAgentLimits[st.assigned_agent_domain] ?? task.totalBudget,
  }));

  const agentAssignments = selectAgentsForPlan(agents, subtaskDomains);

  const selectedAgents: SelectedAgent[] = Array.from(
    agentAssignments.entries()
  ).map(([subtaskId, scored]) => ({
    subtaskId,
    agentId: scored.agent.id,
    agentName: scored.agent.name,
    domain: scored.agent.domain,
    score: scored.score,
    estimatedCost:
      plan.subtasks.find((s) => s.id === subtaskId)?.estimated_cost_usdc ?? 0,
  }));

  for (const sa of selectedAgents) {
    addLog(
      taskId,
      "info",
      `Agent selected: ${sa.agentName} (${sa.domain}) for subtask "${sa.subtaskId}" — score=${sa.score.toFixed(3)}`
    );
  }

  // ── Step 4: Persist to store ────────────────────────────────────────────
  // Map plan subtask IDs to actual store subtask IDs
  const subtasks: Subtask[] = plan.subtasks.map((ps) => {
    const assignment = agentAssignments.get(ps.id);
    return {
      id: ps.id, // keep plan id as subtask id for DAG matching
      taskId,
      agentId: assignment?.agent.id ?? null,
      title: ps.title,
      description: ps.description,
      status: "pending" as const,
      estimatedCost: ps.estimated_cost_usdc,
      actualCost: 0,
      proofType: ps.proof_type,
      proof: null,
      output: null,
      retries: 0,
      dependencies: ps.dependencies,
      completedAt: null,
      createdAt: new Date().toISOString(),
      agentScore: assignment?.score,
    };
  });

  const updatedTask = updateTask(taskId, {
    planJson: plan,
    status: "planning",
    subtasks,
    selectedAgents,
    dagLevels,
  });

  return updatedTask;
}

// ─── Executor ─────────────────────────────────────────────────────────────────

/**
 * Execute a planned and approved task.
 * Runs the execution DAG level-by-level, with MCP chain calls for each step.
 */
export async function orchestrateExecution(taskId: string): Promise<void> {
  const task = getTask(taskId);
  if (!task || !task.planJson) {
    console.error(`[Orchestrator] Task ${taskId} not found or not planned`);
    return;
  }

  updateTask(taskId, { status: "running" });
  addLog(taskId, "info", "Execution started — creating on-chain escrow...");

  // ── Step 1: Create Escrow on Monad ──────────────────────────────────────
  const escrowResult = await createEscrowTask(taskId, task.totalBudget);
  if (escrowResult.txHash) {
    addLog(
      taskId,
      "chain",
      `Escrow created on Monad: $${task.totalBudget} USDC locked`,
      escrowResult.txHash
    );
    addTxRecord(taskId, {
      type: "createEscrow",
      txHash: escrowResult.txHash,
      timestamp: Date.now(),
      amount: task.totalBudget,
      status: "confirmed",
    });
    updateTask(taskId, { escrowTxHash: escrowResult.txHash });
  } else {
    addLog(
      taskId,
      "warn",
      `Escrow: off-chain mode (${escrowResult.error ?? "no chain configured"})`
    );
  }

  // ── Step 2: Execute DAG level by level ──────────────────────────────────
  const plan = task.planJson;
  const dagLevels = task.dagLevels;
  let completedCount = 0;
  const maxRetries = task.guardrail.maxRetries;

  for (const level of dagLevels) {
    // Check for pause signal
    const currentTask = getTask(taskId);
    if (currentTask?.status === "paused") {
      addLog(taskId, "warn", "Execution paused by supervisor");
      break;
    }

    // Level may run in parallel — run all subtasks in this level sequentially
    // (parallel would need Promise.all, keeping sequential for simpler state)
    for (const subtaskPlanId of level) {
      const subtask = getTask(taskId)?.subtasks.find(
        (s) => s.id === subtaskPlanId
      );
      if (!subtask || subtask.status === "completed") {
        if (subtask?.status === "completed") completedCount++;
        continue;
      }

      // Check pause again
      if (getTask(taskId)?.status === "paused") break;

      // Budget check
      const refreshed = getTask(taskId)!;
      const planSubtask = plan.subtasks.find((ps) => ps.id === subtaskPlanId);
      const domain = planSubtask?.assigned_agent_domain ?? "research";
      const agentLimit =
        task.guardrail.perAgentLimits[domain] ?? task.totalBudget;
      const remaining = task.totalBudget - refreshed.spentBudget;

      if (
        subtask.estimatedCost > agentLimit ||
        subtask.estimatedCost > remaining
      ) {
        updateTask(taskId, { status: "paused" });
        addAlert(
          taskId,
          "critical",
          `Budget guardrail: subtask "${subtask.title}" ($${subtask.estimatedCost}) exceeds limit ($${agentLimit})`
        );
        addLog(
          taskId,
          "error",
          `Budget guardrail triggered for: ${subtask.title}`
        );
        break;
      }

      await executeSubtask(
        taskId,
        subtask,
        domain,
        agentLimit,
        maxRetries,
        completedCount
      );

      const updated = getTask(taskId)?.subtasks.find(
        (s) => s.id === subtaskPlanId
      );
      if (updated?.status === "completed") completedCount++;

      // ── Supervisor check every 2 completions or on failure ─────────────
      if (completedCount % 2 === 0 || updated?.status === "failed") {
        await runSupervisorCheck(taskId, completedCount, plan.subtasks.length);
        if (getTask(taskId)?.status === "paused") break;
      }
    }

    if (getTask(taskId)?.status === "paused") break;
  }

  // ── Step 3: Finalize ────────────────────────────────────────────────────
  const finalTask = getTask(taskId);
  if (finalTask?.status === "running") {
    // Refund remaining escrow if any
    const refundResult = await refundEscrowOnChain(taskId);
    if (refundResult.txHash) {
      addLog(
        taskId,
        "chain",
        `Remaining escrow refunded`,
        refundResult.txHash
      );
      addTxRecord(taskId, {
        type: "refund",
        txHash: refundResult.txHash,
        timestamp: Date.now(),
        status: "confirmed",
      });
    }
    updateTask(taskId, { status: "completed" });
    addLog(
      taskId,
      "info",
      `Task completed! ${completedCount}/${plan.subtasks.length} subtasks successful`
    );
  }
}

// ─── Subtask Execution ────────────────────────────────────────────────────────

async function executeSubtask(
  taskId: string,
  subtask: Subtask,
  domain: string,
  agentLimit: number,
  maxRetries: number,
  completedCount: number
): Promise<void> {
  const task = getTask(taskId)!;

  // Find assigned agent
  const assignment = task.selectedAgents.find(
    (sa) => sa.subtaskId === subtask.id
  );
  const agentId = assignment?.agentId ?? null;
  const agentStore = agentId ? store.agents.get(agentId) : null;

  updateSubtask(taskId, subtask.id, { status: "running" });
  addLog(
    taskId,
    "info",
    `Executing: "${subtask.title}" via ${agentStore?.name ?? domain}Agent (score=${assignment?.score?.toFixed(2) ?? "N/A"})`
  );

  let success = false;
  let lastError = "";

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    if (attempt > 0) {
      addLog(
        taskId,
        "warn",
        `Retry ${attempt}/${maxRetries - 1} for: ${subtask.title}`
      );
    }

    try {
      // ── Worker LLM execution ──────────────────────────────────────────
      const result = await runWorker(
        domain,
        subtask.title,
        subtask.description,
        agentLimit
      );

      // ── Proof validation ──────────────────────────────────────────────
      const validation = validateProof(
        result.proof_type,
        result.proof,
        result.output
      );

      if (!validation.valid) {
        lastError = validation.reason;
        updateSubtask(taskId, subtask.id, {
          retries: attempt + 1,
        });
        continue;
      }

      // ── Submit proof on-chain via MCP ─────────────────────────────────
      const proofResult = await submitProofOnChain(
        taskId,
        subtask.id,
        result.proof + result.output.slice(0, 100)
      );

      if (proofResult.txHash) {
        addLog(
          taskId,
          "chain",
          `Proof submitted on-chain for: ${subtask.title}`,
          proofResult.txHash
        );
        addTxRecord(taskId, {
          type: "submitProof",
          txHash: proofResult.txHash,
          timestamp: Date.now(),
          subtaskId: subtask.id,
          agentId: agentId ?? undefined,
          status: "confirmed",
        });
      }

      // ── Approve work + release payment on-chain ───────────────────────
      const agentWallet =
        agentStore?.walletAddress ??
        "0x0000000000000000000000000000000000000001";
      const paymentResult = await approveWorkOnChain(
        taskId,
        subtask.id,
        agentWallet,
        result.cost_used
      );

      if (paymentResult.txHash) {
        addLog(
          taskId,
          "chain",
          `Payment released: $${result.cost_used} USDC → ${agentWallet.slice(0, 10)}...`,
          paymentResult.txHash
        );
        addTxRecord(taskId, {
          type: "approveWork",
          txHash: paymentResult.txHash,
          timestamp: Date.now(),
          subtaskId: subtask.id,
          agentId: agentId ?? undefined,
          amount: result.cost_used,
          status: "confirmed",
        });
      }

      // ── Update store ──────────────────────────────────────────────────
      updateSubtask(taskId, subtask.id, {
        status: "completed",
        output: result.output,
        proof: result.proof,
        proofType: result.proof_type,
        actualCost: result.cost_used,
        completedAt: new Date().toISOString(),
        proofHash: proofResult.data?.proofHash,
      });

      const currentTask = getTask(taskId)!;
      updateTask(taskId, {
        spentBudget: currentTask.spentBudget + result.cost_used,
      });

      // ── Update reputation on-chain ────────────────────────────────────
      if (agentId) {
        const repResult = await updateReputationOnChain(agentId, true);
        if (repResult.txHash) {
          addLog(
            taskId,
            "chain",
            `Reputation updated for ${agentStore?.name}`,
            repResult.txHash
          );
          addTxRecord(taskId, {
            type: "updateReputation",
            txHash: repResult.txHash,
            timestamp: Date.now(),
            agentId,
            status: "confirmed",
          });
          // Update in-memory score slightly
          if (agentStore) {
            agentStore.reputationScore = Math.min(
              5,
              agentStore.reputationScore + 0.02
            );
          }
        }
      }

      success = true;
      addLog(
        taskId,
        "info",
        `✓ Completed: "${subtask.title}" — cost=$${result.cost_used}, confidence=${result.confidence}`
      );
      break;
    } catch (err) {
      lastError = err instanceof Error ? err.message : String(err);
      updateSubtask(taskId, subtask.id, { retries: attempt + 1 });
      addLog(taskId, "warn", `Attempt ${attempt + 1} failed: ${lastError}`);
    }
  }

  if (!success) {
    updateSubtask(taskId, subtask.id, { status: "failed" });
    addLog(taskId, "error", `✗ Failed: "${subtask.title}" — ${lastError}`);

    // Update reputation (failure)
    if (agentId) {
      const repResult = await updateReputationOnChain(agentId, false);
      if (repResult.txHash) {
        addTxRecord(taskId, {
          type: "updateReputation",
          txHash: repResult.txHash,
          timestamp: Date.now(),
          agentId,
          status: "confirmed",
        });
        if (store.agents.get(agentId)) {
          const agent = store.agents.get(agentId)!;
          agent.reputationScore = Math.max(
            1,
            agent.reputationScore - 0.05
          );
        }
      }
    }
  }
}

// ─── Supervisor ───────────────────────────────────────────────────────────────

async function runSupervisorCheck(
  taskId: string,
  completedCount: number,
  totalSubtasks: number
): Promise<void> {
  const task = getTask(taskId)!;
  const recentErrors = task.logs
    .filter((l) => l.level === "error")
    .slice(-3)
    .map((l) => l.message);

  const supervisorResult = await runSupervisor(
    task.title,
    task.totalBudget,
    task.spentBudget,
    completedCount,
    totalSubtasks,
    recentErrors
  );

  addAlert(taskId, supervisorResult.status, supervisorResult.recommendation);
  addLog(
    taskId,
    supervisorResult.status === "ok" ? "info" : "warn",
    `Supervisor [${supervisorResult.status.toUpperCase()}]: ${supervisorResult.recommendation}`
  );

  if (supervisorResult.should_pause) {
    updateTask(taskId, { status: "paused" });
    addLog(taskId, "error", "Supervisor triggered task pause");
  }
}
