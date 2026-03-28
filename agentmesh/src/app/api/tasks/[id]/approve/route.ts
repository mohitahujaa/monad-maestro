import { NextResponse } from "next/server";
import { updateTask, getTask } from "@/lib/store/inMemoryStore";

export async function POST(
  _: Request,
  { params }: { params: { id: string } }
) {
  const task = getTask(params.id);
  if (!task) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }
  const updated = updateTask(params.id, {
    status: "approved",
    approvedAt: new Date().toISOString(),
  });
  return NextResponse.json(updated);
}
