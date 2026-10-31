export const MICRO_FEE_THRESHOLD = 26.67;

export type PaymentRoute = "micro" | "standard";

export function getPaymentRoute(priceUsd: number): PaymentRoute {
  return priceUsd < MICRO_FEE_THRESHOLD ? "micro" : "standard";
}

export function routeLabel(priceUsd: number): string {
  return getPaymentRoute(priceUsd) === "micro"
    ? "Micro-Fee Route Active (Save 4%)"
    : "Standard PayPal Route";
}

export type Product = {
  id: string;
  name: string;
  price: number;
  tagline: string;
  category: string;
  hue: number;
};

export const PRODUCTS: Product[] = [
  { id: "earbuds", name: "Wireless Earbuds", price: 15, tagline: "Pocket-sized ANC, 24h battery", category: "audio", hue: 200 },
  { id: "watch", name: "Smartwatch", price: 120, tagline: "AMOLED, GPS, 7-day battery", category: "wearable", hue: 160 },
  { id: "cable", name: "USB-C Braided Cable", price: 9, tagline: "100W fast charge, 2m", category: "accessory", hue: 30 },
  { id: "charger", name: "MagCharge Pad", price: 25, tagline: "15W wireless charging", category: "accessory", hue: 260 },
  { id: "speaker", name: "Mini Bluetooth Speaker", price: 39, tagline: "360° sound, waterproof", category: "audio", hue: 340 },
  { id: "tracker", name: "Fitness Band", price: 59, tagline: "Heart rate & sleep tracking", category: "wearable", hue: 120 },
];
