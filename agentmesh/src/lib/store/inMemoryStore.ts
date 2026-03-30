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
  provider: "groq" | "openrouter";
  model: string;
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
  // Tasks-as-On-Chain-Programs fields
  parentTaskId: string | null;
  forkCount: number;
  dagHash: string | null;
  version: number;
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

// ─── Seed Data — only agents with valid API keys ──────────────────────────────

const SEED_AGENTS: Agent[] = [
  {
    id: "agent_monad_crypto",
    name: "Monad Crypto Agent",
    domain: "crypto_monad",
    description: "Interacts with Monad testnet via MCP — fetches MON balances, reads contracts, and executes on-chain transactions.",
    reputationScore: 5.0,
    walletAddress: "0x7777777777777777777777777777777777777777",
    hourlyRate: 1,
    maxBudget: 10,
    skills: ["crypto", "monad", "blockchain", "smart contracts", "web3", "defi"],
    provider: "groq",
    model: "llama-3.3-70b-versatile",
    onChainId: null,
    registeredOnChain: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: "agent_grok",
    name: "Grok Oracle",
    domain: "research",
    description: "Powered by xAI Grok — internet-enhanced research, analysis, writing, and data summaries with real-time knowledge.",
    reputationScore: 5.0,
    walletAddress: "0xBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB",
    hourlyRate: 1,
    maxBudget: 15,
    skills: ["research", "writing", "analysis", "data", "summarization", "copywriting", "documentation"],
    provider: "openrouter",
    model: "x-ai/grok-3-mini",
    onChainId: null,
    registeredOnChain: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: "agent_qwen",
    name: "Qwen Architect",
    domain: "coding",
    description: "Powered by Alibaba Qwen — expert in system architecture, full-stack code, testing, and technical documentation.",
    reputationScore: 4.9,
    walletAddress: "0xCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC",
    hourlyRate: 2,
    maxBudget: 25,
    skills: ["coding", "architecture", "testing", "debugging", "system design", "api", "backend", "frontend"],
    provider: "openrouter",
    model: "qwen/qwen3-4b:free",
    onChainId: null,
    registeredOnChain: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: "agent_stability",
    name: "Stability AI",
    domain: "design",
    description: "Powered by Stability AI via OpenRouter — generates UI specs, design systems, visual layouts, and creative assets.",
    reputationScore: 4.8,
    walletAddress: "0xDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD",
    hourlyRate: 3,
    maxBudget: 20,
    skills: ["design", "ui", "ux", "visual", "branding", "layout", "figma", "creative"],
    provider: "groq",
    model: "llama-3.3-70b-versatile",
    onChainId: null,
    registeredOnChain: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: "agent_github",
    name: "GitHub MCP Agent",
    domain: "github",
    description: "Connected to GitHub via MCP — reads repos, creates branches, pushes code, opens PRs, and manages issues.",
    reputationScore: 4.8,
    walletAddress: "0x8888888888888888888888888888888888888888",
    hourlyRate: 5,
    maxBudget: 20,
    skills: ["github", "coding", "version control", "ci/cd", "pull requests", "issues"],
    provider: "groq",
    model: "llama-3.3-70b-versatile",
    onChainId: null,
    registeredOnChain: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: "agent_filesystem",
    name: "Filesystem Worker",
    domain: "filesystem",
    description: "Connected to local filesystem via MCP — reads, writes, and transforms files, scripts, and project structures.",
    reputationScore: 4.9,
    walletAddress: "0x9999999999999999999999999999999999999999",
    hourlyRate: 3,
    maxBudget: 15,
    skills: ["files", "scripting", "local", "automation", "build", "deploy"],
    provider: "groq",
    model: "llama-3.3-70b-versatile",
    onChainId: null,
    registeredOnChain: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: "agent_stability",
    name: "VisualAI Agent",
    domain: "image_gen",
    description: "Generates stunning images from text prompts using Stability AI's Stable Diffusion 3. Describe anything — concept art, UI mockups, illustrations.",
    reputationScore: 4.9,
    walletAddress: "0xDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD",
    hourlyRate: 5,
    maxBudget: 20,
    skills: ["image generation", "concept art", "UI mockups", "stable diffusion"],
    provider: "groq",
    model: "llama-3.3-70b-versatile",
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

// Migration: Remove any stale agents not in the current seed list, then upsert seed agents
const validSeedIds = new Set(SEED_AGENTS.map((a) => a.id));
for (const id of Array.from(store.agents.keys())) {
  // Keep user-registered agents (not in seed) but remove old seed agents that were replaced
  const isOldSeed = [
    "agent_research", "agent_coding", "agent_design", "agent_writing",
    "agent_testing", "agent_data", "agent_brave_search",
  ].includes(id);
  if (isOldSeed && !validSeedIds.has(id)) {
    store.agents.delete(id);
  }
}
for (const seed of SEED_AGENTS) {
  const existing = store.agents.get(seed.id);
  if (!existing) {
    store.agents.set(seed.id, seed);
  } else {
    // Always keep provider + model + skills in sync with seed data
    store.agents.set(seed.id, { ...existing, provider: seed.provider, model: seed.model, skills: seed.skills });
  }
}

globalThis.__agentmesh_store = store;

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

const MAX_TASKS = 50;

export function upsertTask(task: Task): Task {
  // Ensure on-chain program fields are always present (caller values take priority)
  const normalised: Task = {
    ...task,
    parentTaskId: task.parentTaskId ?? null,
    forkCount: task.forkCount ?? 0,
    dagHash: task.dagHash ?? null,
    version: task.version ?? 1,
  };
  store.tasks.set(normalised.id, normalised);
  // Evict oldest tasks if over the cap
  if (store.tasks.size > MAX_TASKS) {
    const sorted = Array.from(store.tasks.values()).sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
    for (let i = 0; i < store.tasks.size - MAX_TASKS; i++) {
      store.tasks.delete(sorted[i].id);
    }
  }
  return normalised;
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

const MAX_LOGS_PER_TASK = 200;

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
    message: message.slice(0, 500), // cap message length
    txHash,
    createdAt: new Date().toISOString(),
  });
  // Keep only the latest logs to prevent unbounded growth
  if (task.logs.length > MAX_LOGS_PER_TASK) {
    task.logs = task.logs.slice(-MAX_LOGS_PER_TASK);
  }
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
