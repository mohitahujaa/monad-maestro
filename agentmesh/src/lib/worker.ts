import { callLLMJSON, LLMProvider } from "./llm-client";
import { getDomainTools } from "./mcpRunner";
import { getAgent } from "./store/inMemoryStore";

export interface WorkerResult {
  output: string;
  proof: string;
  proof_type: string;
  cost_used: number;
  confidence: number;
  mcpLogs?: string[];
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
  agentId: string,
  subtaskTitle: string,
  subtaskDescription: string,
  budgetLimit: number
): Promise<WorkerResult> {
  const agent = getAgent(agentId);
  if (!agent) {
    throw new Error(`Agent ${agentId} not found`);
  }

  let mcpTools: any[] = [];
  try {
    mcpTools = await getDomainTools(agent.domain);
  } catch (e) {
    console.log(`[MCP] No external specialized server found for ${agent.domain}. Running baseline model.`);
  }

  const domainPrompt =
    DOMAIN_PROMPTS[agent.domain] ?? "You are a specialized AI agent connected to external state.";

  // Expose the MCP tool schema to the LLM
  const system = `${domainPrompt}
Budget limit: $${budgetLimit} USDC.

You are equipped with the following MCP Server Capabilities:
${mcpTools.length > 0 ? JSON.stringify(mcpTools, null, 2) : "None."}

If an MCP tool matches the task, simulate its usage strategy in your output details.

Return this exact JSON:
{
  "output": "your full work output here. If you have tools, describe what tools you would use and what arguments you pass.",
  "proof": "link or reference proving work was done",
  "proof_type": "github_commit|file_artifact|api_endpoint|text_report",
  "cost_used": 0.0,
  "confidence": 0.0
}`;

  const user = `Subtask: ${subtaskTitle}\nDetails: ${subtaskDescription}`;
  
  return callLLMJSON<WorkerResult>({
    provider: agent.provider as LLMProvider,
    model: agent.model,
    system,
    user
  });
}

