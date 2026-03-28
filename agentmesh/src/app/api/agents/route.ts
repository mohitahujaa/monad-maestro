import { NextResponse } from "next/server";
import { getAllAgents } from "@/lib/store/inMemoryStore";

export async function GET() {
  const agents = getAllAgents();
  return NextResponse.json(agents);
}
