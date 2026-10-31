import { z } from "zod";
import { chatHistorySchema, shopperInstructions } from "./shopper";

export const GEMINI_SHOPPER_MODEL = "gemini-flash-latest";
export const GEMINI_GATEWAY_URL = "https://connector-gateway.lovable.dev/udc_google_gemini_shopper";

export function geminiShopperPayload(messages: z.infer<typeof chatHistorySchema>["messages"]) {
  const firstUser = messages.findIndex((message) => message.role === "user");
  return {
    systemInstruction: { parts: [{ text: shopperInstructions() }] },
    contents: messages.slice(Math.max(0, firstUser)).map((message) => ({
      role: message.role === "assistant" ? "model" : "user",
      parts: [{ text: message.content }],
    })),
    generationConfig: { maxOutputTokens: 4096, temperature: 0.7 },
  };
}

const chunkSchema = z.object({
  error: z.unknown().optional(),
  candidates: z.array(z.object({
    content: z.object({ parts: z.array(z.object({ text: z.string().optional(), thought: z.boolean().optional() })).optional() }).optional(),
    finishReason: z.string().optional(),
  })).optional(),
});

/** Decode complete SSE events, including UTF-8 and events split across network chunks. */
export async function* geminiTextChunks(body: ReadableStream<Uint8Array>) {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let data: string[] = [];
  const parseEvent = () => {
    if (!data.length) return "";
    const chunk = chunkSchema.parse(JSON.parse(data.join("\n")));
    data = [];
    if (chunk.error !== undefined) throw new Error("Gemini stream failed");
    const candidate = chunk.candidates?.[0];
    if (candidate?.finishReason && !["STOP"].includes(candidate.finishReason)) throw new Error("Gemini response incomplete");
    return candidate?.content?.parts?.filter((part) => !part.thought).map((part) => part.text ?? "").join("") ?? "";
  };
  try {
    while (true) {
      const { value, done } = await reader.read();
      buffer += decoder.decode(value, { stream: !done });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";
      if (done && buffer) { lines.push(buffer); buffer = ""; }
      for (const raw of lines) {
        const line = raw.replace(/\r$/, "");
        if (!line) {
          const text = parseEvent();
          if (text) yield text;
        } else if (line.startsWith("data:")) data.push(line.slice(5).trimStart());
      }
      if (done) { const text = parseEvent(); if (text) yield text; break; }
    }
  } finally { await reader.cancel().catch(() => undefined); reader.releaseLock(); }
}