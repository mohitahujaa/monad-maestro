import { NextResponse } from "next/server";
import { orchestrateExecution } from "@/lib/orchestrator";

export async function POST(
  _: Request,
  { params }: { params: { id: string } }
) {
  // Fire async — don't await so UI gets immediate response
  orchestrateExecution(params.id).catch(console.error);
  return NextResponse.json({ started: true });
}
