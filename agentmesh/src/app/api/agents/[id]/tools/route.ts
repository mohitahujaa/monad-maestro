import { NextResponse } from "next/server";
import { getAgent } from "@/lib/store/inMemoryStore";
import { getDomainTools } from "@/lib/mcpRunner";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const agent = getAgent(id);
  
  if (!agent) {
    return NextResponse.json({ error: "Agent not found" }, { status: 404 });
  }

  try {
    const tools = await getDomainTools(agent.domain);
    return NextResponse.json({ tools });
  } catch (err) {
    console.error(`[Tools API] Failed to fetch tools for ${agent.domain}:`, err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
