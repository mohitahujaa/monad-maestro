import { NextResponse } from "next/server";
import { orchestrate } from "@/lib/orchestrator";

export async function POST(req: Request) {
  try {
    const { prompt } = await req.json();
    if (!prompt?.trim()) {
      return NextResponse.json({ error: "prompt is required" }, { status: 400 });
    }

    const result = await orchestrate(prompt);
    return NextResponse.json(result);
  } catch (err) {
    console.error("[Orchestrate API]", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
