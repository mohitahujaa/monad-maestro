import { callGroqJSON } from "./groq-client";

export interface SupervisorResult {
  status: "ok" | "warning" | "critical";
  issues: string[];
  recommendation: string;
  should_pause: boolean;
}

export async function runSupervisor(
  taskTitle: string,
  totalBudget: number,
  spentBudget: number,
  completedSubtasks: number,
  totalSubtasks: number,
  recentIssues: string[]
): Promise<SupervisorResult> {
  const system = `You are a supervisor monitoring an AI agent task execution.
Your job: detect budget overruns, loops, failures, and hallucinations.
Pause the task if spending exceeds 90% budget with less than 70% completion, or if 2+ agents failed.
Return this exact JSON:
{
  "status": "ok|warning|critical",
  "issues": [],
  "recommendation": "",
  "should_pause": false
}`;

  const user = `Task: ${taskTitle}
Budget: $${spentBudget} spent of $${totalBudget} total
Progress: ${completedSubtasks}/${totalSubtasks} subtasks done
Recent issues: ${recentIssues.join(", ") || "none"}`;

  return callGroqJSON<SupervisorResult>(system, user);
}
