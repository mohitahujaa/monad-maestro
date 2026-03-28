/**
 * Orchestrator — classifies any prompt, selects the best available agent
 * by domain + reputation score, then delegates execution.
 */

import { callLLMJSON } from "./llm-client";
import { getAllAgents } from "./store/inMemoryStore";
import { getReputation } from "./reputation";
import { runWorker } from "./worker";
import { runDomainMcpServer } from "./mcpRunner";
import { updateReputation } from "./reputation";

// Known domains that agents operate in
const KNOWN_DOMAINS = [
  "research",
  "coding",
  "design",
  "writing",
  "testing",
  "data",
  "crypto_monad",
  "github",
  "filesystem",
  "web_search",
] as const;

type Domain = typeof KNOWN_DOMAINS[number];

interface ClassificationResult {
  domain: Domain;
  reasoning: string;
  confidence: number;
}

interface OrchestratorResult {
  selectedAgent: {
    id: string;
    name: string;
    domain: string;
    reputationScore: number;
    provider: string;
    model: string;
  };
  allCandidates: Array<{ id: string; name: string; reputationScore: number; why: string }>;
  classification: ClassificationResult;
  result: any;
  mode: string;
}

// ─── Step 1: Classify prompt into a domain ────────────────────────────────────

async function classifyPrompt(prompt: string): Promise<ClassificationResult> {
  return callLLMJSON<ClassificationResult>({
    provider: "groq",
    model: "llama-3.3-70b-versatile",
    system: `You are a task classifier for an AI agent marketplace. Given a user prompt, determine which agent domain best handles it.

Available domains:
- research: general information lookup, summarization, analysis, news, facts
- coding: writing code, debugging, code review, software architecture
- design: UI/UX design, visual assets, layouts, wireframes
- writing: blog posts, documentation, copywriting, emails
- testing: test cases, QA, validation, bug reports
- data: data analysis, CSV processing, charts, statistics
- crypto_monad: blockchain queries, wallet balances, smart contracts, Monad testnet
- github: repository searches, pull requests, issues, code on GitHub
- filesystem: reading local files, listing directories
- web_search: live internet searches, real-time news, current events

Return JSON: { "domain": "<one of the domains>", "reasoning": "<brief why>", "confidence": 0.0-1.0 }`,
    user: `Classify this prompt: "${prompt}"`,
    maxTokens: 256,
  });
}

// ─── Step 2: Select best agent by reputation ──────────────────────────────────

function selectBestAgent(domain: Domain) {
  const agents = getAllAgents().filter((a) => a.domain === domain);
  if (agents.length === 0) {
    // No exact domain match — fall back to research or coding as catch-all
    const fallback = getAllAgents().filter((a) => a.domain === "research" || a.domain === "coding");
    return fallback.sort((a, b) => {
      const ra = getReputation(a.id).reputationScore;
      const rb = getReputation(b.id).reputationScore;
      return rb - ra;
    });
  }

  return agents.sort((a, b) => {
    const ra = getReputation(a.id).reputationScore;
    const rb = getReputation(b.id).reputationScore;
    return rb - ra;
  });
}

// ─── MCP domains — use direct tool call instead of LLM ────────────────────────

const MCP_TOOL_MAP: Record<string, { tool: string; buildArgs: (p: string) => object }> = {
  web_search:   { tool: "brave_web_search",  buildArgs: (p) => ({ query: p }) },
  filesystem:   { tool: "read_file",         buildArgs: (p) => ({ path: p }) },
  github:       { tool: "search_repositories", buildArgs: (p) => ({ query: p }) },
  crypto_monad: { tool: "get-mon-balance",   buildArgs: (p) => ({ address: p }) },
};

// ─── Main orchestrator function ────────────────────────────────────────────────

export async function orchestrate(prompt: string): Promise<OrchestratorResult> {
  // 1. Classify
  let classification: ClassificationResult;
  try {
    classification = await classifyPrompt(prompt);
  } catch {
    classification = { domain: "research", reasoning: "Classification failed, defaulting to research", confidence: 0.5 };
  }

  const domain = KNOWN_DOMAINS.includes(classification.domain as Domain)
    ? (classification.domain as Domain)
    : "research";

  // 2. Select candidates ranked by reputation
  const candidates = selectBestAgent(domain);
  if (candidates.length === 0) {
    throw new Error(`No agents available for domain: ${domain}`);
  }

  const best = candidates[0];
  const bestRep = getReputation(best.id);

  // 3. Execute
  let result: any;
  let mode: string;

  const mcpConfig = MCP_TOOL_MAP[domain];
  if (mcpConfig) {
    try {
      result = await runDomainMcpServer(domain, mcpConfig.tool, mcpConfig.buildArgs(prompt));
      mode = "mcp";
      updateReputation(best.id, { success: true, proofVerified: true, externalProof: true, budgetAllocated: best.maxBudget, budgetUsed: 0.1 });
    } catch (mcpErr) {
      console.warn(`[Orchestrator] MCP failed for ${domain}, using LLM fallback:`, mcpErr);
      result = await runWorker(best.id, prompt, `Perform the following task: ${prompt}`, best.maxBudget);
      mode = "llm_fallback";
      updateReputation(best.id, { success: true, proofVerified: !!result.proof, budgetAllocated: best.maxBudget, budgetUsed: result.cost_used || 0 });
    }
  } else {
    result = await runWorker(best.id, prompt, `Perform the following task: ${prompt}`, best.maxBudget);
    mode = "llm";
    updateReputation(best.id, {
      success: true,
      proofVerified: !!result.proof,
      externalProof: result.proof_type === "github_commit" || result.proof_type === "file_artifact",
      budgetAllocated: best.maxBudget,
      budgetUsed: result.cost_used || 0,
      userRating: result.confidence ? Math.max(1, Math.round(result.confidence * 5)) : undefined,
      validatorApproved: result.confidence > 0.7,
    });
  }

  return {
    selectedAgent: {
      id: best.id,
      name: best.name,
      domain: best.domain,
      reputationScore: bestRep.reputationScore,
      provider: best.provider,
      model: best.model,
    },
    allCandidates: candidates.map((a) => ({
      id: a.id,
      name: a.name,
      reputationScore: getReputation(a.id).reputationScore,
      why: a.id === best.id ? "Selected — highest reputation score" : `Score: ${getReputation(a.id).reputationScore.toFixed(1)}`,
    })),
    classification,
    result,
    mode,
  };
}
