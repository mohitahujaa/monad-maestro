import { NextResponse } from "next/server";
import { getTask } from "@/lib/store/inMemoryStore";

export async function GET(
  _: Request,
  { params }: { params: { id: string } }
) {
  const task = getTask(params.id);
  if (!task) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }
  return NextResponse.json(task);
}
