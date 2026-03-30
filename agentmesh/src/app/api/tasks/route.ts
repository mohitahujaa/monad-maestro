import { NextResponse } from "next/server";
import { getAllTasks, upsertTask, updateTask, Task } from "@/lib/store/inMemoryStore";
import { orchestratePlan } from "@/lib/orchestrator";

export const maxDuration = 120;

export async function GET() {
  const tasks = getAllTasks();
  return NextResponse.json(tasks);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      title,
      description,
      totalBudget,
      perAgentLimits,
      maxRetries,
      maxToolCalls,
    } = body;

    if (!title || !description || !totalBudget) {
      return NextResponse.json(
        { error: "title, description, and totalBudget are required" },
        { status: 400 }
      );
    }

    // Create task in memory
    const taskId = crypto.randomUUID();
    const task: Task = {
      id: taskId,
      title,
      description,
      status: "pending",
      totalBudget: Number(totalBudget),
      spentBudget: 0,
      planJson: null,
      approvedAt: null,
      escrowTxHash: null,
      createdAt: new Date().toISOString(),
      subtasks: [],
      alerts: [],
      logs: [],
      txRecords: [],
      guardrail: {
        maxRetries: maxRetries ?? 3,
        maxToolCalls: maxToolCalls ?? 10,
        perAgentLimits: perAgentLimits ?? {},
      },
      selectedAgents: [],
      dagLevels: [],
      parentTaskId: null,
      forkCount: 0,
      dagHash: null,
      version: 1,
    };

    upsertTask(task);

    // Run planning (LLM + agent scoring + DAG) async-ish
    // We await it so the client gets back a fully-planned task
    const planned = await orchestratePlan(taskId);

    // Compute a simulated on-chain DAG anchor hash
    const dagHash = `dag_0x${Buffer.from(JSON.stringify(planned?.planJson ?? {})).toString('hex').slice(0, 40)}`;
    updateTask(taskId, { dagHash });

    const finalTask = planned ? { ...planned, dagHash } : { ...task, dagHash };
    return NextResponse.json(finalTask);
  } catch (err) {
    console.error("[POST /api/tasks]", err);
    return NextResponse.json(
      { error: "Failed to create task" },
      { status: 500 }
    );
  }
}
