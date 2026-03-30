import { NextResponse } from "next/server";
import { orchestrateExecution } from "@/lib/orchestrator";

// Keep the serverless function alive long enough for multi-subtask LLM execution
export const maxDuration = 300;

export async function POST(
  _: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  // Await execution so Vercel doesn't kill the function before it finishes
  await orchestrateExecution(id).catch(console.error);
  return NextResponse.json({ started: true });
}
