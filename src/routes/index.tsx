import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Headphones, Watch, Cable, BatteryCharging, Speaker, Activity, Zap, Route as RouteIcon, Lock, Check } from "lucide-react";
import { SiteNav } from "@/components/SiteNav";
import { ChatWidget } from "@/components/ChatWidget";
import { PRODUCTS, getPaymentRoute, routeLabel, type Product } from "@/lib/pricing";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Sentinel Tech Store — Smart gadgets, protected checkout" },
      { name: "description", content: "Shop earbuds, smartwatches and accessories with AI recommendations and fee-optimized PayPal checkout." },
      { property: "og:title", content: "Sentinel Tech Store" },
      { property: "og:description", content: "Smart gadgets with AI shopping help and protected PayPal checkout." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Store,
});

const ICONS: Record<string, typeof Headphones> = {
  earbuds: Headphones, watch: Watch, cable: Cable, charger: BatteryCharging, speaker: Speaker, tracker: Activity,
};

function Store() {
  const [selected, setSelected] = useState<Product>(PRODUCTS[0]!);
  return (
    <div className="min-h-screen">
      <SiteNav />
      <section className="bg-hero text-ink-foreground">
        <div className="mx-auto max-w-7xl px-6 py-20">
          <p className="animate-rise inline-flex items-center gap-2 rounded-full border border-ink-foreground/15 px-3 py-1 text-xs opacity-80">
            <Zap className="h-3 w-3 text-accent" /> Smart fee routing on every order
          </p>
          <h1 className="animate-rise mt-5 max-w-2xl text-5xl font-bold leading-tight md:text-6xl">
            Gadgets that just work. <span className="text-gradient-brand">Checkout that never fails.</span>
          </h1>
          <p className="animate-rise mt-4 max-w-xl opacity-70">Hand-picked tech, AI-powered recommendations and a payment flow guarded end to end.</p>
        </div>
      </section>

      <main className="mx-auto grid max-w-7xl gap-8 px-6 py-12 lg:grid-cols-[1fr_380px]">
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {PRODUCTS.map((p, i) => {
            const Icon = ICONS[p.id] ?? Headphones;
            const micro = getPaymentRoute(p.price) === "micro";
            const isSel = selected.id === p.id;
            return (
              <button
                key={p.id}
                onClick={() => setSelected(p)}
                style={{ animationDelay: `${i * 60}ms` }}
                className={`animate-rise group rounded-2xl border bg-card p-4 text-left shadow-card transition-all hover:-translate-y-1 hover:shadow-glow ${isSel ? "ring-2 ring-primary" : ""}`}
              >
                <div className="grid aspect-[4/3] place-items-center rounded-xl bg-secondary">
                  <Icon className="h-16 w-16 text-primary transition-transform group-hover:scale-110" strokeWidth={1.25} />
                </div>
                <div className="mt-4 flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-semibold">{p.name}</h3>
                    <p className="text-sm text-muted-foreground">{p.tagline}</p>
                  </div>
                  <p className="font-display text-lg font-bold">${p.price}</p>
                </div>
                <RouteBadge price={p.price} />
                <span className="sr-only">{micro ? "micro" : "standard"}</span>
              </button>
            );
          })}
        </div>

        <aside className="h-fit rounded-2xl border bg-card p-6 shadow-card lg:sticky lg:top-24">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Checkout</p>
          <div className="mt-3 flex items-center justify-between">
            <h2 className="text-xl font-bold">{selected.name}</h2>
            <p className="font-display text-2xl font-bold">${selected.price.toFixed(2)}</p>
          </div>
          <RouteBadge price={selected.price} />
          <PayPalContainer product={selected} />
        </aside>
      </main>
      <ChatWidget />
    </div>
  );
}

function RouteBadge({ price }: { price: number }) {
  const micro = getPaymentRoute(price) === "micro";
  return (
    <span className={`mt-3 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${micro ? "bg-success/12 text-success" : "bg-primary/10 text-primary"}`}>
      <span className={`h-1.5 w-1.5 rounded-full animate-pulse-ring ${micro ? "bg-success text-success/40" : "bg-primary text-primary/40"}`} />
      <RouteIcon className="h-3 w-3" /> {routeLabel(price)}
    </span>
  );
}

function PayPalContainer({ product }: { product: Product }) {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const pay = (method: string) => {
    setBusy(true);
    setTimeout(() => {
      setBusy(false);
      toast.success(`Paid $${product.price} via ${method}`, { description: `${routeLabel(product.price)} · Auth Guard: Low risk` });
    }, 1100);
  };
  return (
    <div id="paypal-button-container" className="mt-6 space-y-3 rounded-xl border border-dashed p-4">
      <p className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground"><Lock className="h-3 w-3" /> PayPal Fastlane · Smart Payment Buttons</p>
      <input
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email for Fastlane express checkout"
        className="h-10 w-full rounded-lg border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
      />
      <button disabled={busy} onClick={() => pay("PayPal")} className="h-11 w-full rounded-full bg-paypal font-bold italic text-paypal-foreground transition hover:brightness-95 disabled:opacity-60">
        {busy ? "Processing…" : "PayPal"}
      </button>
      <button disabled={busy} onClick={() => pay("Venmo")} className="h-11 w-full rounded-full bg-primary font-bold text-primary-foreground transition hover:brightness-110 disabled:opacity-60">Venmo</button>
      <button disabled={busy} onClick={() => pay("Card")} className="h-11 w-full rounded-full bg-ink font-semibold text-ink-foreground transition hover:brightness-125 disabled:opacity-60">Debit or Credit Card</button>
      <ul className="space-y-1 pt-2 text-xs text-muted-foreground">
        {["Auth Guard risk screening", "Auto dispute evidence", "Async retry on outages"].map((t) => (
          <li key={t} className="flex items-center gap-1.5"><Check className="h-3 w-3 text-success" /> {t}</li>
        ))}
      </ul>
    </div>
  );
}
