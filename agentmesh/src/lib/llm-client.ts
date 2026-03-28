import Groq from "groq-sdk";

export type LLMProvider = "groq" | "openrouter";

interface LLMRequest {
  provider: LLMProvider;
  model: string;
  system: string;
  user: string;
  maxTokens?: number;
}

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function callLLMJSON<T>(request: LLMRequest): Promise<T> {
  const { provider, model, system, user, maxTokens = 2048 } = request;

  if (provider === "groq") {
    const completion = await groq.chat.completions.create({
      model: model,
      temperature: 0.2,
      max_tokens: maxTokens,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            system +
            "\n\nCRITICAL: Return valid JSON only. No markdown, no explanation, no extra text.",
        },
        { role: "user", content: user },
      ],
    });
    const raw = completion.choices[0].message.content ?? "{}";
    return JSON.parse(raw) as T;
  }

  if (provider === "openrouter") {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey || apiKey === "your_openrouter_key_here") {
      throw new Error("OpenRouter API Key is missing or using placeholder in .env");
    }

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://agentmesh.com",
        "X-Title": "AgentMesh",
      },
      body: JSON.stringify({
        model: model,
        temperature: 0.2,
        max_tokens: maxTokens,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content:
              system +
              "\n\nCRITICAL: Return valid JSON only. No markdown, no explanation, no extra text.",
          },
          { role: "user", content: user },
        ],
      }),
    });

    const rawResponse = await response.text();
    
    if (!response.ok) {
      // On rate limit (429), automatically fall back to Groq
      if (response.status === 429) {
        console.warn(`[LLM Client] OpenRouter 429 rate limit on ${model}, falling back to Groq...`);
        return callLLMJSON<T>({ provider: "groq", model: "llama-3.3-70b-versatile", system, user, maxTokens });
      }
      throw new Error(`OpenRouter API error (Status ${response.status}): ${rawResponse}`);
    }

    try {
      const data = JSON.parse(rawResponse);
      const raw = data.choices[0]?.message?.content ?? "{}";
      return JSON.parse(raw) as T;
    } catch (e) {
      console.error("[LLM Client] Failed to parse OpenRouter response:", rawResponse);
      throw new Error(`Invalid JSON from OpenRouter: ${rawResponse.substring(0, 100)}...`);
    }
  }

  throw new Error(`Unsupported LLM provider: ${provider}`);
}
