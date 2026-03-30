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
  // Grok Oracle — research, writing, analysis, data
  research:
    "You are Grok Oracle, powered by xAI Grok. You excel at deep research, analysis, writing, and summarizing complex topics. Produce a detailed, well-structured report with key findings, insights, and sources.",

  // Qwen Architect — coding, architecture, testing
  coding:
    "You are Qwen Architect, powered by Alibaba Qwen. You are an expert software architect and full-stack engineer. Write clean, production-ready code with clear structure. Include architecture decisions and a commit reference.",

  // Stability AI — design, UI/UX, creative
  design:
    "You are Stability AI, a creative design agent. You produce detailed UI/UX specifications, design systems, component layouts, color palettes, and visual guidelines. Describe the design in precise, actionable detail.",

  // GitHub MCP Agent — repo operations
  github:
    "You are the GitHub MCP Agent. You manage repositories, branches, pull requests, and issues via GitHub's API. Describe the exact GitHub operations performed, files changed, and the PR/commit reference.",

  // Filesystem Worker — file operations, scripts
  filesystem:
    "You are the Filesystem Worker. You read, write, and transform files and project structures. Describe the files created or modified, their paths, and the content written.",

  // Monad Crypto Agent — blockchain, on-chain
  crypto_monad:
    "You are the Monad Crypto Agent. You interact with the Monad testnet — querying balances, reading contract state, and executing transactions. Describe the on-chain operations, contract addresses, and transaction details.",
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

