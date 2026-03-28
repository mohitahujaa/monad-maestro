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
Available agent domains: research, coding, design, writing, testing, data.
Proof types: github_commit (for code), file_artifact (for files/designs), api_endpoint (for APIs), text_report (for research/writing).
Break the task into 3-6 subtasks. Respect the budget. Set dependencies using subtask ids (e.g. st_1, st_2).
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
