import { NextResponse } from "next/server";
import { generateImage } from "@/lib/stability-client";
import { getAgent } from "@/lib/store/inMemoryStore";
import { updateReputation } from "@/lib/reputation";

export async function POST(req: Request) {
  try {
    const { prompt, aspect_ratio, negative_prompt, agentId } = await req.json();
    if (!prompt?.trim()) {
      return NextResponse.json({ error: "prompt is required" }, { status: 400 });
    }

    const result = await generateImage(prompt, { aspect_ratio, negative_prompt });

    // Update reputation for the design agent if supplied
    if (agentId) {
      updateReputation(agentId, {
        success: true,
        proofVerified: true,
        externalProof: true,
        budgetAllocated: 10,
        budgetUsed: 0.1,
        validatorApproved: true,
      });
    }

    return NextResponse.json({
      imageBase64: result.imageBase64,
      mimeType: result.mimeType,
      seed: result.seed,
      prompt: result.prompt,
    });
  } catch (err) {
    console.error("[Stability API]", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
