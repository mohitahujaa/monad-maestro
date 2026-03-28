import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const MODEL = "llama-3.3-70b-versatile";

export async function callGroqJSON<T>(
  systemPrompt: string,
  userPrompt: string,
  maxTokens = 2048
): Promise<T> {
  const completion = await groq.chat.completions.create({
    model: MODEL,
    temperature: 0.2,
    max_tokens: maxTokens,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content:
          systemPrompt +
          "\n\nCRITICAL: Return valid JSON only. No markdown, no explanation, no extra text.",
      },
      { role: "user", content: userPrompt },
    ],
  });
  const raw = completion.choices[0].message.content ?? "{}";
  return JSON.parse(raw) as T;
}
