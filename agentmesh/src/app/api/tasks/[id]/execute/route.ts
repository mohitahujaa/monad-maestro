import { NextResponse } from "next/server";
import { orchestrateExecution } from "@/lib/orchestrator";

export async function POST(
  _: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  // Fire async — don't await so UI gets immediate response
  orchestrateExecution(id).catch(console.error);
  return NextResponse.json({ started: true });
}
