import { NextResponse } from "next/server";
import { updateTask, getTask } from "@/lib/store/inMemoryStore";
import { orchestrateExecution } from "@/lib/orchestrator";

export async function POST(
  _: Request,
  { params }: { params: { id: string } }
) {
  const task = getTask(params.id);
  if (!task) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }
  updateTask(params.id, { status: "approved" });
  orchestrateExecution(params.id).catch(console.error);
  return NextResponse.json({ resumed: true });
}
