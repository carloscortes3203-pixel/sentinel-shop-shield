import { expect, it } from "vitest";
import { GEMINI_SHOPPER_MODEL, geminiShopperPayload, geminiTextChunks } from "@/lib/gemini-shopper";

it("uses the user's selected latest Gemini Flash model", () => {
  expect(GEMINI_SHOPPER_MODEL).toBe("gemini-flash-latest");
});

it("sends full conversation context and catalog fee instructions to Gemini", () => {
  const result = geminiShopperPayload([{ role: "assistant", content: "Hola" }, { role: "user", content: "Tengo $20" }, { role: "assistant", content: "¿Para qué?" }, { role: "user", content: "Música" }]);
  expect(result.contents).toEqual([{ role: "user", parts: [{ text: "Tengo $20" }] }, { role: "model", parts: [{ text: "¿Para qué?" }] }, { role: "user", parts: [{ text: "Música" }] }]);
  expect(result.systemInstruction.parts[0]?.text).toContain('"microFeeThreshold":26.67');
  expect(result.systemInstruction.parts[0]?.text).toContain('"name":"Wireless Earbuds","price":15');
});

it("streams text across split SSE events without exposing thinking parts", async () => {
  const raw = 'data: {"candidates":[{"content":{"parts":[{"text":"hidden","thought":true},{"text":"Música "}]}}]}\r\n\r\ndata: {"candidates":[{"content":{"parts":[{"text":"$15"}]},"finishReason":"STOP"}]}\n\n';
  const bytes = new TextEncoder().encode(raw);
  const body = new ReadableStream<Uint8Array>({ start(controller) { for (let i = 0; i < bytes.length; i += 7) controller.enqueue(bytes.slice(i, i + 7)); controller.close(); } });
  let text = "";
  for await (const chunk of geminiTextChunks(body)) text += chunk;
  expect(text).toBe("Música $15");
});