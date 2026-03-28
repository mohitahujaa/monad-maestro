/**
 * In-Memory Store — replaces Prisma/PostgreSQL for AgentMesh.
 * Uses the globalThis singleton pattern (same as Prisma.ts) so state
 * persists across Next.js HMR reloads in development.
 */

export interface Agent {
  id: string;
  name: string;
  domain: string;
  description: string;
  reputationScore: number;
  walletAddress: string;
  hourlyRate: number;
  maxBudget: number;
  skills: string[];
  onChainId: string | null;   // bytes32 agentId on-chain
  registeredOnChain: boolean;
  createdAt: string;
}

export interface TxRecord {
  type:
    | "registerAgent"
    | "createEscrow"
    | "submitProof"
    | "approveWork"
    | "updateReputation"
    | "refund";
  txHash: string;
  timestamp: number;
  subtaskId?: string;
  agentId?: string;
  amount?: number;
  status: "confirmed" | "pending" | "failed";
}

export interface Subtask {
  id: string;
  taskId: string;
  agentId: string | null;
  title: string;
  description: string;
  status: "pending" | "running" | "completed" | "failed";
  estimatedCost: number;
  actualCost: number;
  proofType: string;
  proof: string | null;
  output: string | null;
  retries: number;
  dependencies: string[];
  completedAt: string | null;
  createdAt: string;
  agentScore?: number;
  proofHash?: string;
}

export interface SupervisorAlert {
  id: string;
  taskId: string;
  severity: string;
  message: string;
  createdAt: string;
}

export interface ExecutionLog {
  id: string;
  taskId: string;
  level: "info" | "warn" | "error" | "chain";
  message: string;
  txHash?: string;
  createdAt: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  status:
    | "pending"
    | "planning"
    | "approved"
    | "running"
    | "paused"
    | "completed"
    | "failed";
  totalBudget: number;
  spentBudget: number;
  planJson: PlanJson | null;
  approvedAt: string | null;
  escrowTxHash: string | null;
  createdAt: string;
  subtasks: Subtask[];
  alerts: SupervisorAlert[];
  logs: ExecutionLog[];
  txRecords: TxRecord[];
  guardrail: {
    maxRetries: number;
    maxToolCalls: number;
    perAgentLimits: Record<string, number>;
  };
  selectedAgents: SelectedAgent[];
  dagLevels: string[][];  // subtask IDs grouped by execution level
}

export interface SelectedAgent {
  subtaskId: string;
  agentId: string;
  agentName: string;
  domain: string;
  score: number;
  estimatedCost: number;
}

export interface PlanJson {
  subtasks: PlanSubtask[];
  total_estimated_cost: number;
  confidence_score: number;
  risks: string[];
}

export interface PlanSubtask {
  id: string;
  title: string;
  description: string;
  assigned_agent_domain: string;
  estimated_cost_usdc: number;
  estimated_time_hours: number;
  dependencies: string[];
  proof_type: string;
}

// ─── Seed Data ────────────────────────────────────────────────────────────────

const SEED_AGENTS: Agent[] = [
  {
    id: "agent_research",
    name: "ResearchAgent",
    domain: "research",
    description: "Searches, summarizes, and gathers information from multiple sources.",
    reputationScore: 4.8,
    walletAddress: "0x1111111111111111111111111111111111111111",
    hourlyRate: 2,
    maxBudget: 5,
    skills: ["research", "analysis", "summarization"],
    onChainId: null,
    registeredOnChain: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: "agent_coding",
    name: "CodeAgent",
    domain: "coding",
    description: "Writes, reviews, and debugs code across multiple languages.",
    reputationScore: 4.9,
    walletAddress: "0x2222222222222222222222222222222222222222",
    hourlyRate: 5,
    maxBudget: 15,
    skills: ["coding", "debugging", "review"],
    onChainId: null,
    registeredOnChain: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: "agent_design",
    name: "DesignAgent",
    domain: "design",
    description: "Creates UI layouts, design specs, and visual assets.",
    reputationScore: 4.6,
    walletAddress: "0x3333333333333333333333333333333333333333",
    hourlyRate: 4,
    maxBudget: 10,
    skills: ["design", "ui", "ux"],
    onChainId: null,
    registeredOnChain: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: "agent_writing",
    name: "WritingAgent",
    domain: "writing",
    description: "Produces technical docs, blog posts, and copywriting.",
    reputationScore: 4.7,
    walletAddress: "0x4444444444444444444444444444444444444444",
    hourlyRate: 2,
    maxBudget: 6,
    skills: ["writing", "documentation", "copywriting"],
    onChainId: null,
    registeredOnChain: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: "agent_testing",
    name: "TestingAgent",
    domain: "testing",
    description: "Writes test suites, runs QA checks, and validates outputs.",
    reputationScore: 4.5,
    walletAddress: "0x5555555555555555555555555555555555555555",
    hourlyRate: 3,
    maxBudget: 8,
    skills: ["testing", "qa", "validation"],
    onChainId: null,
    registeredOnChain: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: "agent_data",
    name: "DataAgent",
    domain: "data",
    description: "Processes datasets, runs analysis, and generates reports.",
    reputationScore: 4.7,
    walletAddress: "0x6666666666666666666666666666666666666666",
    hourlyRate: 3,
    maxBudget: 10,
    skills: ["data", "analysis", "reporting"],
    onChainId: null,
    registeredOnChain: false,
    createdAt: new Date().toISOString(),
  },
];

// ─── Store Structure ──────────────────────────────────────────────────────────

export interface AgentMeshStore {
  agents: Map<string, Agent>;
  tasks: Map<string, Task>;
}

function createStore(): AgentMeshStore {
  const agents = new Map<string, Agent>();
  for (const agent of SEED_AGENTS) {
    agents.set(agent.id, agent);
  }
  return {
    agents,
    tasks: new Map<string, Task>(),
  };
}

// ─── Singleton ────────────────────────────────────────────────────────────────

declare global {
  // eslint-disable-next-line no-var
  var __agentmesh_store: AgentMeshStore | undefined;
}

export const store: AgentMeshStore =
  globalThis.__agentmesh_store ?? (globalThis.__agentmesh_store = createStore());

if (process.env.NODE_ENV !== "production") {
  globalThis.__agentmesh_store = store;
}

// ─── Helper Functions ─────────────────────────────────────────────────────────

export function getTask(id: string): Task | undefined {
  return store.tasks.get(id);
}

export function getAllTasks(): Task[] {
  return Array.from(store.tasks.values()).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export function getAgent(id: string): Agent | undefined {
  return store.agents.get(id);
}

export function getAllAgents(): Agent[] {
  return Array.from(store.agents.values()).sort(
    (a, b) => b.reputationScore - a.reputationScore
  );
}

export function getAgentByDomain(domain: string): Agent | undefined {
  return Array.from(store.agents.values()).find(
    (a) => a.domain === domain
  );
}

export function upsertTask(task: Task): Task {
  store.tasks.set(task.id, task);
  return task;
}

export function updateTask(id: string, updates: Partial<Task>): Task | null {
  const task = store.tasks.get(id);
  if (!task) return null;
  const updated = { ...task, ...updates };
  store.tasks.set(id, updated);
  return updated;
}

export function updateSubtask(
  taskId: string,
  subtaskId: string,
  updates: Partial<Subtask>
): Subtask | null {
  const task = store.tasks.get(taskId);
  if (!task) return null;
  const idx = task.subtasks.findIndex((s) => s.id === subtaskId);
  if (idx === -1) return null;
  task.subtasks[idx] = { ...task.subtasks[idx], ...updates };
  store.tasks.set(taskId, task);
  return task.subtasks[idx];
}

export function addAlert(
  taskId: string,
  severity: string,
  message: string
): void {
  const task = store.tasks.get(taskId);
  if (!task) return;
  task.alerts.push({
    id: crypto.randomUUID(),
    taskId,
    severity,
    message,
    createdAt: new Date().toISOString(),
  });
  store.tasks.set(taskId, task);
}

export function addLog(
  taskId: string,
  level: ExecutionLog["level"],
  message: string,
  txHash?: string
): void {
  const task = store.tasks.get(taskId);
  if (!task) return;
  task.logs.push({
    id: crypto.randomUUID(),
    taskId,
    level,
    message,
    txHash,
    createdAt: new Date().toISOString(),
  });
  store.tasks.set(taskId, task);
}

export function addTxRecord(taskId: string, record: TxRecord): void {
  const task = store.tasks.get(taskId);
  if (!task) return;
  task.txRecords.push(record);
  store.tasks.set(taskId, task);
}

export function upsertAgent(agent: Agent): Agent {
  store.agents.set(agent.id, agent);
  return agent;
}
