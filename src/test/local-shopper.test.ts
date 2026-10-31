import { describe, expect, it } from "vitest";
import { localShopperReply } from "@/lib/local-shopper";

describe("local shopper simulation", () => {
  it("recommends the $15 earbuds for music within $20", () => {
    const result = localShopperReply([{ from: "user", text: "Tengo $20 y busco música" }]);
    expect(result).toContain("Wireless Earbuds — $15.00 USD");
    expect(result).not.toContain("Mini Bluetooth Speaker");
  });
  it("retains a budget across follow-up messages", () => {
    const result = localShopperReply([{ from: "user", text: "Tengo $20" }, { from: "bot", text: "¿Qué buscas?" }, { from: "user", text: "Para escuchar música" }]);
    expect(result).toContain("Wireless Earbuds — $15.00 USD");
    expect(result).not.toContain("Mini Bluetooth Speaker");
  });
  it("responds dynamically for running instead of recommending audio", () => {
    const result = localShopperReply([{ from: "user", text: "Quiero algo para correr, tengo $60" }]);
    expect(result).toContain("Fitness Band — $59.00 USD");
    expect(result).not.toContain("Smartwatch —");
    expect(result).not.toContain("Wireless Earbuds");
  });
  it("explains the strict $26.67 micropayment threshold and non-discount 4%", () => {
    const result = localShopperReply([{ from: "user", text: "¿Cuál es la tarifa de Micropagos?" }]);
    expect(result).toContain("estrictamente menores a $26.67 USD");
    expect(result).toContain("desde $26.67");
    expect(result).toContain("4%");
    expect(result).toContain("no un descuento al comprador");
    expect(result).toContain("producción no está habilitado");
  });
});