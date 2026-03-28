/**
 * Stability AI Client — generates images from text prompts.
 * Uses the Stability AI v2beta Stable Diffusion 3 API.
 * Returns: { imageBase64: string, mimeType: string, seed: number }
 */

export interface StabilityResult {
  imageBase64: string;
  mimeType: "image/png" | "image/webp" | "image/jpeg";
  seed: number;
  prompt: string;
}

export async function generateImage(
  prompt: string,
  options: {
    aspect_ratio?: "1:1" | "16:9" | "21:9" | "2:3" | "3:2" | "4:5" | "5:4" | "9:16" | "9:21";
    output_format?: "png" | "webp" | "jpeg";
    negative_prompt?: string;
  } = {}
): Promise<StabilityResult> {
  const apiKey = process.env.STABILITY_API_KEY;
  if (!apiKey || apiKey === "your_stability_api_key_here") {
    throw new Error("STABILITY_API_KEY is not set in .env. Get a key at https://platform.stability.ai/account/keys");
  }

  const { aspect_ratio = "1:1", output_format = "png", negative_prompt } = options;

  const form = new FormData();
  form.append("prompt", prompt);
  form.append("aspect_ratio", aspect_ratio);
  form.append("output_format", output_format);
  if (negative_prompt) form.append("negative_prompt", negative_prompt);

  const response = await fetch(
    "https://api.stability.ai/v2beta/stable-image/generate/sd3",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        Accept: "image/*",
      },
      body: form,
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Stability AI error (${response.status}): ${errorText}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  const base64 = Buffer.from(arrayBuffer).toString("base64");
  const seedHeader = response.headers.get("seed") ?? "0";
  const contentType = (response.headers.get("content-type") ?? "image/png") as StabilityResult["mimeType"];

  return {
    imageBase64: base64,
    mimeType: contentType,
    seed: parseInt(seedHeader),
    prompt,
  };
}
