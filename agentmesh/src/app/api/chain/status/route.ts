import { NextResponse } from "next/server";
import { getChainStatus } from "@/lib/mcpClient";

/**
 * GET /api/chain/status
 * Returns current chain connectivity, block number, and contract deployment status.
 */
export async function GET() {
  const status = await getChainStatus();
  return NextResponse.json(status);
}
