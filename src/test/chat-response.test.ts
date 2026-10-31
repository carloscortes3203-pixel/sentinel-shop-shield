import { expect, it } from "vitest";
import { chatUnavailable } from "@/lib/chat-response";

it("returns provider unavailability as a readable chat event rather than a failed page request", async () => {
  const response = chatUnavailable("Provider unavailable");
  expect(response.status).toBe(200);
  expect(response.headers.get("Content-Type")).toContain("application/x-ndjson");
  expect(response.headers.get("Cache-Control")).toBe("no-store");
  expect(JSON.parse(await response.text())).toEqual({ error: "Provider unavailable" });
});