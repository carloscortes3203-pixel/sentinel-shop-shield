import { describe, expect, it, vi } from "vitest";
import { createCheckoutHandlers, PAYPAL_OPTIONS } from "@/lib/paypal";
import { PRODUCTS } from "@/lib/pricing";

describe("PayPal Sandbox checkout", () => {
  it("uses the supplied Sandbox Client ID", () => {
    expect(PAYPAL_OPTIONS.clientId).toBe("BAAExrhRc6oupuy4uVTGJ6L-0rAiiLJEb_mO956j4V_mfzOIWtD8LPu1EqgjRcKqf1kvCRJOiGF9AYvF-o");
  });

  it("uses USD", () => {
    expect(PAYPAL_OPTIONS.currency).toBe("USD");
  });

  it.each([PRODUCTS[0], PRODUCTS[1]])("creates a test order for the selected product", async (product) => {
    if (!product) throw new Error("Missing test product");
    const create = vi.fn().mockResolvedValue("TEST-ORDER");
    const handlers = createCheckoutHandlers(product, vi.fn());
    const result = await handlers.createOrder?.({ paymentSource: "paypal" }, { order: { create } });
    expect(result).toBe("TEST-ORDER");
    expect(create).toHaveBeenCalledWith({ intent: "CAPTURE", purchase_units: [{ reference_id: product.id, description: product.name, amount: { currency_code: "USD", value: product.price.toFixed(2) } }] });
  });

  it("captures approved orders and confirms only completed payments", async () => {
    const product = PRODUCTS[0];
    if (!product) throw new Error("Missing test product");
    const confirmed = vi.fn();
    const capture = vi.fn().mockResolvedValue({ id: "CAPTURED-ORDER", status: "COMPLETED" });
    const handlers = createCheckoutHandlers(product, confirmed);
    const actions = { order: { capture, get: vi.fn(), authorize: vi.fn(), patch: vi.fn() }, redirect: vi.fn(), restart: vi.fn() };
    await handlers.onApprove?.({ orderID: "TEST-ORDER" }, actions);
    expect(capture).toHaveBeenCalledOnce();
    expect(confirmed).toHaveBeenCalledWith("CAPTURED-ORDER");
    confirmed.mockClear();
    capture.mockResolvedValue({ id: "PENDING-ORDER", status: "PENDING" });
    await expect(handlers.onApprove?.({ orderID: "TEST-ORDER" }, actions)).rejects.toThrow("not completed");
    expect(confirmed).not.toHaveBeenCalled();
    capture.mockRejectedValue(new Error("Network failure"));
    await expect(handlers.onApprove?.({ orderID: "TEST-ORDER" }, actions)).rejects.toThrow("Network failure");
    expect(confirmed).not.toHaveBeenCalled();
  });
});