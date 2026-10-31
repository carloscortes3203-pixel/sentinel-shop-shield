/** Provider failures are a recoverable chat result, not a failed page request. */
export function chatUnavailable(message: string): Response {
  return new Response(JSON.stringify({ error: message }) + "\n", {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}