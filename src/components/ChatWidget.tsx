import { useEffect, useRef, useState } from "react";
import { Bot, Send, ShieldCheck, X } from "lucide-react";
import { PRODUCTS, routeLabel } from "@/lib/pricing";

type Msg = { from: "bot" | "user"; text: string };

function reply(q: string): string {
  const s = q.toLowerCase();
  const budget = s.match(/\$?(\d+)/);
  if (s.includes("cheap") || s.includes("budget") || s.includes("under")) {
    const max = budget ? Number(budget[1]) : 30;
    const list = PRODUCTS.filter((p) => p.price <= max).sort((a, b) => a.price - b.price);
    if (!list.length) return `Nothing under $${max} right now — the closest is ${PRODUCTS[2].name} at $${PRODUCTS[2].price}.`;
    return `Under $${max}: ${list.map((p) => `${p.name} ($${p.price})`).join(", ")}. All of these ride the Micro-Fee Route, saving 4% on fees.`;
  }
  const byCat = (c: string) => PRODUCTS.filter((p) => p.category === c);
  if (/(music|audio|earbud|sound|speaker)/.test(s)) {
    return `For audio I'd pick: ${byCat("audio").map((p) => `${p.name} $${p.price} — ${p.tagline}`).join("; ")}.`;
  }
  if (/(watch|fitness|run|health|wear)/.test(s)) {
    return `For fitness: ${byCat("wearable").map((p) => `${p.name} $${p.price}`).join(" or ")}. The Smartwatch has GPS for runners.`;
  }
  if (/(gift|recommend|best|suggest)/.test(s)) {
    return `Top picks: Wireless Earbuds ($15, ${routeLabel(15)}) and Smartwatch ($120, ${routeLabel(120)}).`;
  }
  if (/(safe|secure|fraud|protect|pay)/.test(s)) {
    return "Every checkout is screened by Auth Guard and protected by automatic dispute evidence. You can pay with PayPal, Venmo or card.";
  }
  return "I can help you find gadgets! Try “earbuds under $20”, “something for running”, or “best gift”.";
}

export function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([
    { from: "bot", text: "Hi! I'm Sentinel, your AI shopper guard. Tell me what you need and your budget." },
  ]);
  const end = useRef<HTMLDivElement>(null);
  useEffect(() => end.current?.scrollIntoView({ behavior: "smooth" }), [msgs, typing]);

  const send = (text: string) => {
    if (!text.trim()) return;
    setMsgs((m) => [...m, { from: "user", text }]);
    setInput("");
    setTyping(true);
    setTimeout(() => {
      setTyping(false);
      setMsgs((m) => [...m, { from: "bot", text: reply(text) }]);
    }, 700);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      {open && (
        <div className="animate-rise flex h-[30rem] w-[22rem] flex-col overflow-hidden rounded-2xl border bg-card shadow-glow">
          <div className="bg-hero flex items-center justify-between px-4 py-3 text-ink-foreground">
            <div className="flex items-center gap-2">
              <span className="grid h-8 w-8 place-items-center rounded-full bg-gradient-brand"><ShieldCheck className="h-4 w-4" /></span>
              <div>
                <p className="text-sm font-semibold">Sentinel AI Shopper Guard</p>
                <p className="flex items-center gap-1 text-xs opacity-70"><span className="h-1.5 w-1.5 rounded-full bg-success" /> Online</p>
              </div>
            </div>
            <button aria-label="Close chat" onClick={() => setOpen(false)} className="opacity-70 hover:opacity-100"><X className="h-4 w-4" /></button>
          </div>
          <div className="flex-1 space-y-3 overflow-y-auto p-4">
            {msgs.map((m, i) => (
              <div key={i} className={`animate-rise flex ${m.from === "user" ? "justify-end" : ""}`}>
                <p className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${m.from === "user" ? "bg-primary text-primary-foreground" : "bg-secondary"}`}>{m.text}</p>
              </div>
            ))}
            {typing && <p className="w-14 rounded-2xl bg-secondary px-3 py-2 text-sm text-muted-foreground animate-pulse">•••</p>}
            <div ref={end} />
          </div>
          <div className="flex flex-wrap gap-1.5 px-4 pb-2">
            {["Earbuds under $20", "For running", "Best gift"].map((c) => (
              <button key={c} onClick={() => send(c)} className="rounded-full border px-2.5 py-1 text-xs text-muted-foreground hover:border-primary hover:text-primary">{c}</button>
            ))}
          </div>
          <form onSubmit={(e) => { e.preventDefault(); send(input); }} className="flex gap-2 border-t p-3">
            <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask for a recommendation…" className="flex-1 rounded-lg bg-secondary px-3 text-sm outline-none focus:ring-2 focus:ring-ring" />
            <button aria-label="Send" className="grid h-9 w-9 place-items-center rounded-lg bg-primary text-primary-foreground"><Send className="h-4 w-4" /></button>
          </form>
        </div>
      )}
      <button onClick={() => setOpen((o) => !o)} className="flex items-center gap-2 rounded-full bg-ink px-5 py-3 text-sm font-semibold text-ink-foreground shadow-glow transition-transform hover:scale-105">
        <Bot className="h-5 w-5 text-accent" /> Sentinel AI Shopper Guard
      </button>
    </div>
  );
}
