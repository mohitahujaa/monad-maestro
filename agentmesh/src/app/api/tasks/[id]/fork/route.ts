import { NextResponse } from "next/server";
import { getTask, upsertTask, updateTask } from "@/lib/store/inMemoryStore";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: parentId } = await params;
    const parent = getTask(parentId);

    if (!parent) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    // Optional overrides from request body
    let body: { title?: string; description?: string; totalBudget?: number } = {};
    try {
      body = await req.json();
    } catch {
      // empty body is fine
    }

    const newVersion = (parent.version ?? 1) + 1;
    const newId = crypto.randomUUID();

    // Deep-copy and reset subtask execution state
    const forkedSubtasks = (parent.subtasks ?? []).map((st) => ({
      ...st,
      id: crypto.randomUUID(),
      taskId: newId,
      status: "pending" as const,
      proof: null,
      output: null,
      completedAt: null,
      actualCost: 0,
      retries: 0,
    }));

    const dagHash = `dag_${Date.now()}`;

    const forkedTask = {
      id: newId,
      title: body.title ?? parent.title,
      description: body.description ?? parent.description,
      totalBudget: body.totalBudget !== undefined ? Number(body.totalBudget) : parent.totalBudget,
      status: "planning" as const,
      spentBudget: 0,
      planJson: parent.planJson,
      approvedAt: null,
      escrowTxHash: null,
      createdAt: new Date().toISOString(),
      subtasks: forkedSubtasks,
      alerts: [],
      logs: [],
      txRecords: [],
      guardrail: { ...parent.guardrail },
      selectedAgents: parent.selectedAgents ? [...parent.selectedAgents] : [],
      dagLevels: parent.dagLevels ? [...parent.dagLevels] : [],
      parentTaskId: parentId,
      forkCount: 0,
      dagHash,
      version: newVersion,
    };

    upsertTask(forkedTask);

    // Increment parent's fork count
    updateTask(parentId, { forkCount: (parent.forkCount ?? 0) + 1 });

    console.log(`[info] Forked from task ${parentId} (v${parent.version ?? 1} → v${newVersion})`);

    return NextResponse.json(forkedTask);
  } catch (err) {
    console.error("[POST /api/tasks/[id]/fork]", err);
    return NextResponse.json({ error: "Failed to fork task" }, { status: 500 });
  }
}
