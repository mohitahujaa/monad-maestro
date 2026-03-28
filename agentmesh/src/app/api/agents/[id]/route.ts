import { NextResponse } from "next/server";
import { getAgent } from "@/lib/store/inMemoryStore";
import { runWorker } from "@/lib/worker";
import { runDomainMcpServer } from "@/lib/mcpRunner";
import { updateReputation } from "@/lib/reputation";

const MCP_TOOL_MAP: Record<string, { tool: string; buildArgs: (prompt: string) => object }> = {
  web_search: {
    tool: "brave_web_search",
    buildArgs: (prompt) => ({ query: prompt }),
  },
  filesystem: {
    tool: "read_file",
    buildArgs: (prompt) => ({ path: prompt }),
  },
  github: {
    tool: "search_repositories",
    buildArgs: (prompt) => ({ query: prompt }),
  },
  crypto_monad: {
    tool: "get-mon-balance",
    buildArgs: (prompt) => ({ address: prompt }),
  },
};

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const agent = getAgent(id);
  if (!agent) {
    return NextResponse.json({ error: "Agent not found" }, { status: 404 });
  }

  const body = await req.json();
  const prompt: string = body.prompt || "";
  const toolName: string = body.toolName || "";
  const args: object = body.args || {};

  // If a specific tool and args are provided (direct call)
  if (toolName) {
    try {
      const toolResult = await runDomainMcpServer(
        agent.domain,
        toolName,
        args
      );
      return NextResponse.json({
        mode: "mcp",
        agent: { id: agent.id, name: agent.name, domain: agent.domain },
        tool: toolName,
        args,
        result: toolResult,
      });
    } catch (err) {
      console.error(`[Exec API] Direct tool call failed for ${toolName}:`, err);
      updateReputation(agent.id, { success: false, proofVerified: false });
      return NextResponse.json({ 
        error: `Failed to execute tool ${toolName}`, 
        details: String(err) 
      }, { status: 500 });
    }
  }

  // Fallback to existing prompt-based logic
  const mcpConfig = MCP_TOOL_MAP[agent.domain];
  
  // ... rest of the existing prompt logic

  // If agent has a direct MCP server, try to run it
  if (mcpConfig) {
    try {
      const mcpResult = await runDomainMcpServer(
        agent.domain,
        mcpConfig.tool,
        mcpConfig.buildArgs(prompt)
      );
      updateReputation(agent.id, {
        success: true,
        proofVerified: true,
        externalProof: true,
        budgetAllocated: agent.maxBudget,
        budgetUsed: 0.1,
      });
      return NextResponse.json({
        mode: "mcp",
        agent: { id: agent.id, name: agent.name, domain: agent.domain },
        tool: mcpConfig.tool,
        input: prompt,
        result: mcpResult,
      });
    } catch (mcpErr) {
      // Fall back to LLM worker with context
      console.warn(`[run] MCP failed for ${agent.domain}, falling back to LLM:`, mcpErr);
      const workerResult = await runWorker(
        agent.id,
        `[MCP fallback] ${prompt}`,
        `The MCP server for ${agent.domain} was unavailable. Use your knowledge to answer: ${prompt}`,
        agent.maxBudget
      );
      return NextResponse.json({
        mode: "llm_fallback",
        agent: { id: agent.id, name: agent.name, domain: agent.domain },
        input: prompt,
        result: workerResult,
        mcpError: String(mcpErr),
      });
    }
  }

  // Standard LLM-backed agents
  try {
    const workerResult = await runWorker(
      agent.id,
      prompt,
      `Perform the following task using your domain expertise: ${prompt}`,
      agent.maxBudget
    );
    updateReputation(agent.id, {
      success: true,
      proofVerified: !!workerResult.proof,
      externalProof: workerResult.proof_type === "github_commit" || workerResult.proof_type === "file_artifact",
      budgetAllocated: agent.maxBudget,
      budgetUsed: workerResult.cost_used || 0,
      userRating: workerResult.confidence ? Math.max(1, Math.round(workerResult.confidence * 5)) : undefined,
      validatorApproved: workerResult.confidence > 0.7,
    });
    return NextResponse.json({
      mode: "llm",
      agent: { id: agent.id, name: agent.name, domain: agent.domain },
      input: prompt,
      result: workerResult,
    });
  } catch (err) {
    console.error(`[run] LLM worker failed for ${agent.id}:`, err);
    updateReputation(agent.id, { success: false, retries: 1 });
    return NextResponse.json(
      { error: String(err), agent: { id: agent.id, name: agent.name } },
      { status: 500 }
    );
  }
}
