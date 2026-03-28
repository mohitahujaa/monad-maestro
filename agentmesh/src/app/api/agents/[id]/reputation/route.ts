import { NextResponse } from "next/server";
import { getAgent } from "@/lib/store/inMemoryStore";
import { getReputation, updateReputation, ReputationUpdate } from "@/lib/reputation";

// GET /api/agents/[id]/reputation — fetch full reputation breakdown
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const agent = getAgent(id);
  if (!agent) return NextResponse.json({ error: "Agent not found" }, { status: 404 });

  const rep = getReputation(id);
  return NextResponse.json({ agent: { id, name: agent.name }, reputation: rep });
}

// POST /api/agents/[id]/reputation — record a task outcome
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const agent = getAgent(id);
  if (!agent) return NextResponse.json({ error: "Agent not found" }, { status: 404 });

  const update: ReputationUpdate = await req.json();
  const rep = updateReputation(id, update);
  return NextResponse.json({ agent: { id, name: agent.name }, reputation: rep });
}
