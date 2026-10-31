import { createFileRoute } from "@tanstack/react-router";
import { chatHistorySchema, shopperInstructions } from "@/lib/shopper";

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const origin = request.headers.get("origin");
        if (!origin || origin !== new URL(request.url).origin) {
          return Response.json({ error: "Solicitud no autorizada." }, { status: 403 });
        }
        if (!request.headers.get("content-type")?.includes("application/json")) {
          return Response.json({ error: "Solicitud inválida." }, { status: 415 });
        }
        const rawBody = await request.text();
        if (rawBody.length > 150000) return Response.json({ error: "La conversación es demasiado larga. Abre una nueva conversación." }, { status: 413 });
        let body: unknown;
        try { body = JSON.parse(rawBody); } catch {
          return Response.json({ error: "Solicitud inválida." }, { status: 400 });
        }
        const parsed = chatHistorySchema.safeParse(body);
        if (!parsed.success) return Response.json({ error: "El mensaje o la conversación es demasiado largo. Abre una nueva conversación." }, { status: 400 });
        const apiKey = process.env['OPENAI_API_KEY'];
        if (!apiKey) return Response.json({ error: "El chat está pendiente de configurar su conexión con OpenAI." }, { status: 503 });
        try {
          const { default: OpenAI } = await import("openai");
          const client = new OpenAI({ apiKey, maxRetries: 0 });
          const completion = await client.chat.completions.create({
            model: "gpt-4o-mini", stream: true,
            messages: [{ role: "system", content: shopperInstructions() }, ...parsed.data.messages],
          }, { signal: request.signal });
          const encoder = new TextEncoder();
          const stream = new ReadableStream<Uint8Array>({
            async start(controller) {
              const emit = (event: object) => controller.enqueue(encoder.encode(JSON.stringify(event) + "\n"));
              try {
                for await (const chunk of completion) {
                  const text = chunk.choices[0]?.delta.content;
                  if (text) emit({ text });
                }
                emit({ done: true });
              } catch {
                if (!request.signal.aborted) emit({ error: "La respuesta se interrumpió. Puedes intentarlo nuevamente." });
              } finally { controller.close(); }
            },
            cancel() { completion.controller.abort(); },
          });
          return new Response(stream, { headers: { "Content-Type": "application/x-ndjson; charset=utf-8", "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" } });
        } catch (cause) {
          if (cause instanceof Error && "code" in cause && (cause.code === "insufficient_quota" || cause.code === "credit_balance_exhausted")) {
            return Response.json({ error: "OpenAI no tiene saldo o cuota disponible. El propietario debe revisar la facturación de su cuenta." }, { status: 429 });
          }
          return Response.json({ error: "No se pudo conectar con OpenAI. Revisa la clave, el saldo y los límites de tu cuenta." }, { status: 502 });
        }
      },
    },
  },
});