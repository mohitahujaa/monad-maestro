import { callGroqJSON } from "./groq-client";

export interface WorkerResult {
  output: string;
  proof: string;
  proof_type: string;
  cost_used: number;
  confidence: number;
}

const DOMAIN_PROMPTS: Record<string, string> = {
  research:
    "You are a research agent. Find, analyze, and summarize information. Return a detailed text report with sources.",
  coding:
    "You are a senior software engineer. Write clean, working code for the given task. Return code with a GitHub-style commit reference.",
  design:
    "You are a UI/UX designer. Create detailed design specifications and component descriptions.",
  writing:
    "You are a technical writer. Produce clear, structured written content.",
  testing:
    "You are a QA engineer. Write comprehensive test cases and validation scripts.",
  data:
    "You are a data analyst. Process and analyze data, then return a structured report.",
};

export async function runWorker(
  domain: string,
  subtaskTitle: string,
  subtaskDescription: string,
  budgetLimit: number
): Promise<WorkerResult> {
  const domainPrompt =
    DOMAIN_PROMPTS[domain] ?? "You are a helpful AI agent.";

  const system = `${domainPrompt}
Budget limit: $${budgetLimit} USDC.
Return this exact JSON:
{
  "output": "your full work output here",
  "proof": "link or reference proving work was done",
  "proof_type": "github_commit|file_artifact|api_endpoint|text_report",
  "cost_used": 0.0,
  "confidence": 0.0
}`;

  const user = `Subtask: ${subtaskTitle}\nDetails: ${subtaskDescription}`;
  return callGroqJSON<WorkerResult>(system, user);
}
