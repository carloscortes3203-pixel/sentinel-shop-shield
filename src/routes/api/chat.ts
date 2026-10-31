import { createFileRoute } from "@tanstack/react-router";
import { chatHistorySchema } from "@/lib/shopper";
import { chatUnavailable } from "@/lib/chat-response";
import { GEMINI_GATEWAY_URL, GEMINI_SHOPPER_MODEL, geminiShopperPayload, geminiTextChunks } from "@/lib/gemini-shopper";

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
        const apiKey = process.env['LOVABLE_API_KEY'];
        const connectionKey = process.env['UDC_GOOGLE_GEMINI_SHOPPER_API_KEY'];
        if (!apiKey || !connectionKey) return chatUnavailable("Gemini está pendiente de configurar; usaré el respaldo local.");
        const upstream = new AbortController();
        const abort = () => upstream.abort();
        request.signal.addEventListener("abort", abort, { once: true });
        if (request.signal.aborted) abort();
        const timeout = setTimeout(abort, 45000);
        const release = () => { clearTimeout(timeout); request.signal.removeEventListener("abort", abort); };
        try {
          const completion = await fetch(`${GEMINI_GATEWAY_URL}/v1beta/models/${GEMINI_SHOPPER_MODEL}:streamGenerateContent?alt=sse`, {
            method: "POST",
            headers: { "Authorization": `Bearer ${apiKey}`, "X-Connection-Api-Key": connectionKey, "Content-Type": "application/json" },
            body: JSON.stringify(geminiShopperPayload(parsed.data.messages)),
            signal: upstream.signal,
          });
          if (!completion.ok) {
            // Never log raw provider bodies: they can echo credentials supplied in errors.
            console.error("Gemini provider request failed", { status: completion.status });
            await completion.body?.cancel();
            release();
            return chatUnavailable(`Gemini no pudo responder (HTTP ${completion.status}); usaré el respaldo local.`);
          }
          if (!completion.body) { release(); return chatUnavailable("Gemini no devolvió una respuesta; usaré el respaldo local."); }
          const body = completion.body;
          const encoder = new TextEncoder();
          let canceled = false;
          const stream = new ReadableStream<Uint8Array>({
            async start(controller) {
              const emit = (event: object) => { if (!canceled) controller.enqueue(encoder.encode(JSON.stringify(event) + "\n")); };
              let received = false;
              try {
                for await (const text of geminiTextChunks(body)) {
                  if (canceled) break;
                  received = true;
                  emit({ text });
                }
                if (received) emit({ done: true });
                else emit({ error: "Gemini no devolvió texto; usaré el respaldo local." });
              } catch {
                if (!request.signal.aborted) emit({ error: "La respuesta se interrumpió. Puedes intentarlo nuevamente." });
              } finally { release(); if (!canceled) controller.close(); }
            },
            cancel() { canceled = true; upstream.abort(); release(); },
          });
          return new Response(stream, { headers: { "Content-Type": "application/x-ndjson; charset=utf-8", "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" } });
        } catch {
          release();
          return chatUnavailable("No se pudo conectar con Gemini; usaré el respaldo local.");
        }
      },
    },
  },
});