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
    provider: "groq",
    model: "llama-3.3-70b-versatile",
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
    provider: "groq",
    model: "llama-3.3-70b-versatile",
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
    provider: "groq",
    model: "llama-3.3-70b-versatile",
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
    provider: "groq",
    model: "llama-3.3-70b-versatile",
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
    provider: "groq",
    model: "llama-3.3-70b-versatile",
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
    provider: "groq",
    model: "llama-3.3-70b-versatile",
    onChainId: null,
    registeredOnChain: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: "agent_monad_crypto",
    name: "Monad Crypto Agent",
    domain: "crypto_monad",
    description: "Interacts with Monad testnet, fetches MON tokens balances and interacts with smart contracts.",
    reputationScore: 5.0,
    walletAddress: "0x7777777777777777777777777777777777777777",
    hourlyRate: 1,
    maxBudget: 10,
    skills: ["crypto", "monad", "blockchain", "smart contracts"],
    provider: "groq",
    model: "llama-3.3-70b-versatile",
    onChainId: null,
    registeredOnChain: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: "agent_github",
    name: "GitHub MCP Agent",
    domain: "github",
    description: "Reads repositories, pushes code, creates issues and pull requests via GitHub.",
    reputationScore: 4.8,
    walletAddress: "0x8888888888888888888888888888888888888888",
    hourlyRate: 5,
    maxBudget: 20,
    skills: ["github", "coding", "version control"],
    provider: "groq",
    model: "llama-3.3-70b-versatile",
    onChainId: null,
    registeredOnChain: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: "agent_filesystem",
    name: "Filesystem Worker",
    domain: "filesystem",
    description: "Securely reads, writes, and manipulates local files directly on the host.",
    reputationScore: 4.9,
    walletAddress: "0x9999999999999999999999999999999999999999",
    hourlyRate: 3,
    maxBudget: 15,
    skills: ["files", "scripting", "local"],
    provider: "groq",
    model: "llama-3.3-70b-versatile",
    onChainId: null,
    registeredOnChain: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: "agent_brave_search",
    name: "Brave Search Agent",
    domain: "web_search",
    description: "Performs live web searches on the internet to gather up-to-date data for tasks.",
    reputationScore: 4.7,
    walletAddress: "0xAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
    hourlyRate: 2,
    maxBudget: 8,
    skills: ["search", "web", "research"],
    provider: "groq",
    model: "llama-3.3-70b-versatile",
    onChainId: null,
    registeredOnChain: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: "agent_grok",
    name: "Grok Oracle",
    domain: "research",
    description: "Powered by x-AI Grok-1. Balanced and witty research agent with internet-enhanced knowledge.",
    reputationScore: 5.0,
    walletAddress: "0xBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB",
    hourlyRate: 1,
    maxBudget: 15,
    skills: ["witty", "advanced research", "real-time"],
    provider: "openrouter",
    model: "x-ai/grok-3-mini",
    onChainId: null,
    registeredOnChain: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: "agent_qwen",
    name: "Qwen Architect",
    domain: "coding",
    description: "Powered by Alibaba's Qwen-2.5-72B. Specialized in architectural design and code documentation.",
    reputationScore: 4.9,
    walletAddress: "0xCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC",
    hourlyRate: 2,
    maxBudget: 25,
    skills: ["architecture", "documentation", "system design"],
    provider: "openrouter",
    model: "qwen/qwen3-4b:free",
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

// Migration: Always sync provider/model from seed so stale values are corrected
for (const seed of SEED_AGENTS) {
  const existing = store.agents.get(seed.id);
  if (!existing) {
    store.agents.set(seed.id, seed);
  } else {
    // Always keep provider + model in sync with seed data
    store.agents.set(seed.id, { ...existing, provider: seed.provider, model: seed.model });
  }
}

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
