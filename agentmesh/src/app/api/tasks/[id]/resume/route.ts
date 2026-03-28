import { NextResponse } from "next/server";
import { updateTask, getTask } from "@/lib/store/inMemoryStore";
import { orchestrateExecution } from "@/lib/orchestrator";

export async function POST(
  _: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const task = getTask(id);
  if (!task) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }
  updateTask(id, { status: "approved" });
  orchestrateExecution(id).catch(console.error);
  return NextResponse.json({ resumed: true });
}
