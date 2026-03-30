import { callGroqJSON } from "./groq-client";

export interface Subtask {
  id: string;
  title: string;
  description: string;
  assigned_agent_domain: string;
  estimated_cost_usdc: number;
  estimated_time_hours: number;
  dependencies: string[];
  proof_type:
    | "github_commit"
    | "file_artifact"
    | "api_endpoint"
    | "text_report";
}

export interface PlanResult {
  subtasks: Subtask[];
  total_estimated_cost: number;
  confidence_score: number;
  risks: string[];
}

export async function planTask(
  title: string,
  description: string,
  totalBudget: number,
  perAgentLimits: Record<string, number>
): Promise<PlanResult> {
  const system = `You are a task planner for an AI agent workforce platform.

Available agent domains (use ONLY these exact string values):
- "research"     → Grok Oracle (xAI Grok): research, writing, analysis, data reports, copywriting, documentation
- "coding"       → Qwen Architect (Alibaba Qwen): code, architecture, testing, debugging, APIs, backend, frontend
- "design"       → Stability AI: UI/UX specs, design systems, layouts, branding, visual assets
- "github"       → GitHub MCP Agent: repo operations, pull requests, issues, branches, CI/CD pipelines
- "filesystem"   → Filesystem Worker: file read/write, scripts, build automation, local deployment
- "crypto_monad" → Monad Crypto Agent: blockchain queries, smart contract calls, MON balance, on-chain transactions

Proof types: github_commit (for coding/github tasks), file_artifact (for files/designs/scripts), api_endpoint (for APIs/endpoints), text_report (for research/writing/analysis).
Break the task into 2-5 subtasks. Respect the budget. Set dependencies using subtask ids (e.g. st_1, st_2).
Return this exact JSON shape:
{
  "subtasks": [{ "id": "st_1", "title": "", "description": "", "assigned_agent_domain": "", "estimated_cost_usdc": 0, "estimated_time_hours": 0, "dependencies": [], "proof_type": "" }],
  "total_estimated_cost": 0,
  "confidence_score": 0,
  "risks": []
}`;

  const user = `Task: ${title}
Description: ${description}
Total budget: $${totalBudget} USDC
Per-agent limits: ${JSON.stringify(perAgentLimits)}`;

  return callGroqJSON<PlanResult>(system, user);
}
