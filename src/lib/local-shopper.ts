import { MICRO_FEE_THRESHOLD, PRODUCTS, getPaymentRoute, type Product } from "./pricing";

export type ShopperMessage = { from: "bot" | "user"; text: string };

function normalize(text: string) {
  return text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function budgetFrom(text: string): number | undefined {
  const match = text.match(/(?:\$\s*|(?:presupuesto(?:\s+de)?|tengo|hasta|menos de|under|budget(?:\s+of)?|up to)\s*\$?\s*)(\d+(?:[.,]\d+)?)/i);
  return match ? Number(match[1].replace(",", ".")) : undefined;
}

function productLine(product: Product, english: boolean) {
  const route = getPaymentRoute(product.price) === "micro"
    ? (english ? "micropayment demo route" : "ruta de Micropagos de la demo")
    : "Standard PayPal Route";
  return `- **${product.name} — $${product.price.toFixed(2)} USD**: ${product.tagline}. ${route}.`;
}

/** Catalog-grounded simulation; no model call, invented specifications or guaranteed fees. */
export function localShopperReply(history: ShopperMessage[]): string {
  const users = history.filter((message) => message.from === "user");
  const latest = normalize(users.at(-1)?.text ?? "");
  const context = users.map((message) => normalize(message.text)).join(" ");
  const english = /\b(under|for running|best gift|recommend|budget|fees|what|how|price|thanks)\b/.test(latest)
    && !/\b(tengo|busco|quiero|precio|comision|tarifa|micropagos|gracias)\b/.test(latest);
  const prefix = english ? "*Local simulation · not GPT-4o.*\n\n" : "*Simulación local · no es GPT-4o.*\n\n";
  if (/micropag|micro.?fee|comision|tarifa|fees|ahorro|save|saving|paypal|26[.,]67/.test(latest)) {
    const example = PRODUCTS.find((product) => latest.includes(normalize(product.name)) || latest.includes(product.id));
    const sample = example ? productLine(example, english) : [PRODUCTS.find((p) => p.id === "earbuds"), PRODUCTS.find((p) => p.id === "watch")].filter((p): p is Product => Boolean(p)).map((p) => productLine(p, english)).join("\n");
    return prefix + (english
      ? `Prices **strictly below $${MICRO_FEE_THRESHOLD.toFixed(2)} USD** display **Micro-Fee Route Active (Save 4%)**; $26.67 or more displays **Standard PayPal Route**.\n\n${sample}\n\nThe advertised 4% is a simulated merchant fee saving, not a shopper discount or an official universal PayPal rate. Actual fees depend on country and agreement. Checkout uses PayPal Sandbox test orders; production micropayment routing is not enabled.`
      : `Los precios **estrictamente menores a $${MICRO_FEE_THRESHOLD.toFixed(2)} USD** muestran **Micro-Fee Route Active (Save 4%)**; desde $26.67 muestran **Standard PayPal Route**.\n\n${sample}\n\nEl 4% anunciado es un ahorro simulado de comisiones para el vendedor, no un descuento al comprador ni una tarifa oficial universal de PayPal. Las tarifas reales dependen del país y del contrato. El checkout usa órdenes de prueba de PayPal Sandbox; el enrutamiento de Micropagos de producción no está habilitado.`);
  }
  if (/\b(gracias|thanks|thank you)\b/.test(latest)) return prefix + (english ? "You're welcome! Would you like to compare another catalog product?" : "¡Con gusto! ¿Quieres comparar otro producto del catálogo?");
  if (/\b(gpt|modelo|model|openai|inteligencia)\b/.test(latest)) return prefix + (english ? "I use local catalog-based rules in this mode, not an OpenAI model. I can compare products, budgets and the demo's micropayment badges." : "En este modo respondo con reglas locales basadas en el catálogo, no con un modelo de OpenAI. Puedo comparar productos, presupuestos y las etiquetas de Micropagos de la demo.");
  const budget = [...users].reverse().map((message) => budgetFrom(message.text)).find((value) => value !== undefined);
  const explicit = PRODUCTS.filter((product) => latest.includes(normalize(product.name)) || latest.includes(product.id));
  const intent = /musica|audio|music|escuchar|earbud|auricular|audifono|speaker|altavoz/.test(latest) ? "audio"
    : /correr|running|fitness|ejercicio|reloj|watch|pulsera/.test(latest) ? "wearable"
    : /carga|charg|cable|bateria/.test(latest) ? "accessory"
    : /musica|audio|music|escuchar|earbud/.test(context) ? "audio"
    : /correr|running|fitness|reloj|watch/.test(context) ? "wearable" : undefined;
  const candidates = explicit.length ? explicit : PRODUCTS.filter((product) => !intent || product.category === intent);
  const affordable = candidates.filter((product) => budget === undefined || product.price <= budget).sort((a, b) => a.price - b.price);
  if (!affordable.length) return prefix + (english
    ? `No matching catalog product fits your $${budget?.toFixed(2)} USD budget.\n\n${candidates.map((product) => productLine(product, english)).join("\n")}\n\nWould you like another category or a higher budget?`
    : `Ningún producto de esta categoría cabe en tu presupuesto de $${budget?.toFixed(2)} USD.\n\n${candidates.map((product) => productLine(product, english)).join("\n")}\n\n¿Prefieres otra categoría o aumentar el presupuesto?`);
  const intro = budget === undefined ? (english ? "These catalog options may suit you:" : "Estas opciones del catálogo pueden servirte:")
    : (english ? `Within your $${budget.toFixed(2)} USD budget:` : `Dentro de tu presupuesto de $${budget.toFixed(2)} USD:`);
  return prefix + intro + "\n\n" + affordable.slice(0, 3).map((product) => productLine(product, english)).join("\n")
    + "\n\n" + (english ? "Would you like to compare features or payment fees?" : "¿Quieres comparar características o comisiones de pago?");
}