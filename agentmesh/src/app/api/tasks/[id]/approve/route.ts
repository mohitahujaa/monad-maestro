import { NextResponse } from "next/server";
import { updateTask, getTask } from "@/lib/store/inMemoryStore";

export async function POST(
  _: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const task = getTask(id);
  if (!task) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }
  const updated = updateTask(id, {
    status: "approved",
    approvedAt: new Date().toISOString(),
  });
  return NextResponse.json(updated);
}
