import { NextResponse } from "next/server";
import { upsertAgent, getAllAgents } from "@/lib/store/inMemoryStore";
import { registerAgentOnChain, initReputationOnChain } from "@/lib/mcpClient";

/**
 * POST /api/agents/register
 * Registers an agent in the in-memory store and on Monad blockchain.
 *
 * Body: { name, domain, description, skills, hourlyRate, maxBudget, walletAddress }
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, domain, description, skills, hourlyRate, maxBudget, walletAddress, model } = body;

    if (!name || !domain || !skills?.length) {
      return NextResponse.json(
        { error: "name, domain, and skills are required" },
        { status: 400 }
      );
    }

    const agentId = `agent_${domain}_${Date.now()}`;
    const metadata = JSON.stringify({ name, description, domain });

    // 1. Register on-chain via MCP
    const chainResult = await registerAgentOnChain(
      agentId,
      skills,
      hourlyRate ?? 2,
      metadata
    );

    // 2. Initialize reputation on-chain
    let repTxHash: string | null = null;
    if (chainResult.txHash) {
      const repResult = await initReputationOnChain(agentId, 4.5);
      repTxHash = repResult.txHash;
    }

    // 3. Store in memory
    const agent = upsertAgent({
      id: agentId,
      name,
      domain,
      description: description ?? "",
      reputationScore: 4.5,
      walletAddress: walletAddress ?? `0x${crypto.randomUUID().replace(/-/g, "").slice(0, 40)}`,
      hourlyRate: hourlyRate ?? 2,
      maxBudget: maxBudget ?? 10,
      skills,
      provider: "groq" as const,
      model: model ?? "llama-3.1-8b-instant",
      onChainId: chainResult.data?.agentId ?? null,
      registeredOnChain: chainResult.onChain,
      createdAt: new Date().toISOString(),
    });

    return NextResponse.json({
      agent,
      txHash: chainResult.txHash,
      repTxHash,
      onChain: chainResult.onChain,
    });
  } catch (err) {
    console.error("[POST /api/agents/register]", err);
    return NextResponse.json(
      { error: "Failed to register agent" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/agents/register — list all agents (alias)
 */
export async function GET() {
  return NextResponse.json(getAllAgents());
}
