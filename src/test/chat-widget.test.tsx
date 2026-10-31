import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
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
    await waitFor(() => expect(screen.getByRole("button", { name: "Send" })).toBeInTheDocument());
    expect(scroll).toHaveBeenCalled();
    expect(() => unmount()).not.toThrow();
  } finally {
    if (original) Object.defineProperty(HTMLElement.prototype, "scrollIntoView", original);
    else Reflect.deleteProperty(HTMLElement.prototype, "scrollIntoView");
  }
});

it("supports local responses and clears the sent draft", async () => {
  const fetch = vi.fn();
  vi.stubGlobal("fetch", fetch);
  render(<ChatWidget mode="local" />);
  fireEvent.click(screen.getByRole("button", { name: "Sentinel AI Shopper Guard" }));
  const input = screen.getByRole("textbox", { name: "Mensaje" });
  fireEvent.change(input, { target: { value: "Tengo $20 y busco música" } });
  fireEvent.click(screen.getByRole("button", { name: "Send" }));
  expect(input).toHaveValue("");
  await screen.findByText(/Wireless Earbuds — \$15.00 USD/);
  expect(fetch).not.toHaveBeenCalled();
});

it("resets drafts and history during a response without stale replies returning", async () => {
  render(<ChatWidget mode="local" />);
  fireEvent.click(screen.getByRole("button", { name: "Sentinel AI Shopper Guard" }));
  const input = screen.getByRole("textbox", { name: "Mensaje" });
  fireEvent.change(input, { target: { value: "Tengo $20 y busco música" } });
  fireEvent.click(screen.getByRole("button", { name: "Send" }));
  fireEvent.change(input, { target: { value: "Borrador" } });
  fireEvent.click(screen.getByRole("button", { name: "Nueva conversación" }));
  expect(input).toHaveValue("");
  expect(screen.queryByText("Tengo $20 y busco música")).not.toBeInTheDocument();
  fireEvent.change(input, { target: { value: "Quiero un reloj" } });
  fireEvent.click(screen.getByRole("button", { name: "Send" }));
  await screen.findByText(/Smartwatch — \$120.00 USD/);
  expect(screen.queryByText(/Wireless Earbuds —/)).not.toBeInTheDocument();
});

it("does not substitute a local answer after provider failure and accepts the next message", async () => {
  const fetch = vi.fn().mockImplementationOnce(() => Promise.resolve(new Response('{"error":"HTTP 503"}\n')))
    .mockImplementationOnce(() => Promise.resolve(new Response('{"text":"Wireless Earbuds $15"}\n{"done":true}\n')));
  vi.stubGlobal("fetch", fetch);
  render(<ChatWidget />);
  fireEvent.click(screen.getByRole("button", { name: "Sentinel AI Shopper Guard" }));
  const input = screen.getByRole("textbox", { name: "Mensaje" });
  fireEvent.change(input, { target: { value: "Tengo $20 y busco música" } });
  fireEvent.click(screen.getByRole("button", { name: "Send" }));
  expect(input).toHaveValue("");
  await waitFor(() => expect(screen.getByRole("button", { name: "Send" })).toBeInTheDocument());
  expect(screen.queryByText(/Wireless Earbuds/)).not.toBeInTheDocument();
  fireEvent.change(input, { target: { value: "¿Y las comisiones?" } });
  fireEvent.click(screen.getByRole("button", { name: "Send" }));
  await screen.findByText(/Wireless Earbuds \$15/);
  expect(fetch).toHaveBeenCalledTimes(2);
  expect(input).toHaveValue("");
});