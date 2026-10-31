import { describe, it, expect } from "vitest";
import { getPaymentRoute, routeLabel } from "@/lib/pricing";

describe("payment route badge", () => {
  it("$15 earbuds use the micro-fee route", () => {
    expect(routeLabel(15)).toBe("Micro-Fee Route Active (Save 4%)");
  });
  it("$120 smartwatch uses the standard route", () => {
    expect(routeLabel(120)).toBe("Standard PayPal Route");
  });
  it("$26.67 exactly is standard, $26.66 is micro", () => {
    expect(getPaymentRoute(26.67)).toBe("standard");
    expect(getPaymentRoute(26.66)).toBe("micro");
  });
});
