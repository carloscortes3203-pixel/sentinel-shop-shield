import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { ChatWidget } from "@/components/ChatWidget";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

it("does not use a browser scroll return value as effect cleanup", async () => {
  // Some browser implementations return a Promise from scrollIntoView.
  const scroll = vi.fn(() => Promise.resolve());
  const original = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "scrollIntoView");
  Object.defineProperty(HTMLElement.prototype, "scrollIntoView", { configurable: true, value: scroll });
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response('{"error":"Unavailable"}\n')));
  try {
    const { unmount } = render(<ChatWidget />);
    fireEvent.click(screen.getByRole("button", { name: "Sentinel AI Shopper Guard" }));
    fireEvent.change(screen.getByRole("textbox", { name: "Mensaje" }), { target: { value: "Earbuds" } });
    fireEvent.click(screen.getByRole("button", { name: "Send" }));
    await screen.findByRole("alert");
    expect(scroll).toHaveBeenCalled();
    expect(() => unmount()).not.toThrow();
  } finally {
    if (original) Object.defineProperty(HTMLElement.prototype, "scrollIntoView", original);
    else Reflect.deleteProperty(HTMLElement.prototype, "scrollIntoView");
  }
});