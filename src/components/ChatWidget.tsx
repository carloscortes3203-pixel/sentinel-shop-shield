import { useEffect, useRef, useState } from "react";
import { Bot, Send, ShieldCheck, X, Square, RotateCcw } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { Button } from "@/components/ui/button";
import { localShopperReply } from "@/lib/local-shopper";

type Msg = { from: "bot" | "user"; text: string };

const greeting: Msg = { from: "bot", text: "¡Hola! Soy Sentinel, tu asistente de compras. ¿Qué buscas y cuál es tu presupuesto?" };

export function ChatWidget({ mode = "local" }: { mode?: "local" | "openai" }) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([greeting]);
  const active = useRef<AbortController | null>(null);
  const end = useRef<HTMLDivElement>(null);
  useEffect(() => {
    end.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs, typing]);
  useEffect(() => () => active.current?.abort(), []);

  const reset = () => {
    const controller = active.current;
    active.current = null;
    controller?.abort();
    setMsgs([greeting]);
    setInput("");
    setTyping(false);
  };

  const send = async (text: string) => {
    if (!text.trim() || active.current) return;
    const history: Msg[] = [...msgs.filter((m) => m.text.trim()), { from: "user", text: text.trim() }];
    const controller = new AbortController();
    active.current = controller;
    setMsgs([...history, { from: "bot", text: "" }]);
    setInput("");
    setTyping(true);
    let received = "";
    try {
      if (mode === "local") {
        await new Promise<void>((resolve) => {
          const timeout = setTimeout(resolve, 250);
          controller.signal.addEventListener("abort", () => { clearTimeout(timeout); resolve(); }, { once: true });
        });
        if (active.current === controller && !controller.signal.aborted) {
          setMsgs([...history, { from: "bot", text: localShopperReply(history) }]);
        }
        return;
      }
      const response = await fetch("/api/chat", {
        method: "POST", headers: { "Content-Type": "application/json" }, signal: controller.signal,
        body: JSON.stringify({ messages: history.map((m) => ({ role: m.from === "user" ? "user" : "assistant", content: m.text })) }),
      });
      if (!response.ok) {
        const payload = await response.json();
        throw new Error(typeof payload.error === "string" ? payload.error : "No se pudo enviar el mensaje.");
      }
      const reader = response.body?.getReader();
      if (!reader) throw new Error("No se recibió una respuesta.");
      const decoder = new TextDecoder();
      let buffer = "";
      let complete = false;
      while (true) {
        const { value, done } = await reader.read();
        if (active.current !== controller || controller.signal.aborted) { await reader.cancel(); return; }
        buffer += decoder.decode(value, { stream: !done });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.trim()) continue;
          const event = JSON.parse(line);
          if (typeof event.error === "string") throw new Error(event.error);
          if (event.done === true) complete = true;
          if (typeof event.text === "string") {
            received += event.text;
            setMsgs([...history, { from: "bot", text: received }]);
          }
        }
        if (done) break;
      }
      if (!complete || !received) throw new Error("La respuesta se interrumpió. Puedes intentarlo nuevamente.");
    } catch {
      if (active.current === controller && !controller.signal.aborted) {
        setMsgs([...history, { from: "bot", text: localShopperReply(history) }]);
      }
    } finally {
      if (active.current === controller) {
        active.current = null;
        setTyping(false);
      }
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      {open && (
        <div role="dialog" aria-label="Sentinel AI Shopper Guard" className="animate-rise flex h-[30rem] max-h-[calc(100dvh-7rem)] w-[22rem] max-w-[calc(100vw-3rem)] flex-col overflow-hidden rounded-2xl border bg-card shadow-glow">
          <div className="bg-hero flex items-center justify-between px-4 py-3 text-ink-foreground">
            <div className="flex items-center gap-2">
              <span className="grid h-8 w-8 place-items-center rounded-full bg-gradient-brand"><ShieldCheck className="h-4 w-4" /></span>
              <div>
                <p className="text-sm font-semibold">Sentinel AI Shopper Guard</p>
                <p className="flex items-center gap-1 text-xs opacity-70"><span className="h-1.5 w-1.5 rounded-full bg-success" /> {typing ? "Respondiendo…" : "Asistente de compras"}</p>
              </div>
            </div>
            <div className="flex"><Button variant="ghost" size="icon" title="Nueva conversación" aria-label="Nueva conversación" onClick={reset}><RotateCcw /></Button><Button variant="ghost" size="icon" aria-label="Close chat" onClick={() => setOpen(false)}><X /></Button></div>
          </div>
          <div className="flex-1 space-y-3 overflow-y-auto p-4">
            {msgs.map((m, i) => (
              <div key={i} className={`animate-rise flex ${m.from === "user" ? "justify-end" : ""}`}>
                 {m.text && <div className={`max-w-[85%] break-words rounded-2xl px-3 py-2 text-sm [&_p]:my-1 [&_ul]:list-disc [&_ul]:pl-4 [&_ol]:list-decimal [&_ol]:pl-4 [&_a]:underline ${m.from === "user" ? "bg-primary text-primary-foreground" : "bg-secondary"}`}><ReactMarkdown>{m.text}</ReactMarkdown></div>}
              </div>
            ))}
            {typing && <p className="w-14 rounded-2xl bg-secondary px-3 py-2 text-sm text-muted-foreground animate-pulse">•••</p>}
            <div ref={end} />
          </div>
          <div className="flex flex-wrap gap-1.5 px-4 pb-2">
            {["Earbuds under $20", "For running", "Best gift"].map((c) => (
              <Button variant="outline" size="sm" disabled={typing} key={c} onClick={() => void send(c)} className="h-auto rounded-full px-2.5 py-1 text-xs text-muted-foreground">{c}</Button>
            ))}
          </div>
          <form onSubmit={(e) => { e.preventDefault(); send(input); }} className="flex gap-2 border-t p-3">
            <input aria-label="Mensaje" maxLength={12000} value={input} onChange={(e) => setInput(e.target.value)} placeholder="Pregunta por un producto…" className="min-w-0 flex-1 rounded-lg bg-secondary px-3 text-sm outline-none focus:ring-2 focus:ring-ring" />
            {typing ? <Button type="button" aria-label="Detener respuesta" size="icon" onClick={() => { const controller = active.current; active.current = null; controller?.abort(); setTyping(false); setMsgs((history) => history.filter((message) => message.text.trim())); }}><Square /></Button> : <Button aria-label="Send" size="icon" disabled={!input.trim()}><Send /></Button>}
          </form>
        </div>
      )}
      <Button aria-expanded={open} onClick={() => setOpen((o) => !o)} className="h-auto rounded-full bg-ink px-5 py-3 text-sm font-semibold text-ink-foreground shadow-glow transition-transform hover:scale-105 hover:bg-ink">
        <Bot className="h-5 w-5 text-accent" /> Sentinel AI Shopper Guard
      </Button>
    </div>
  );
}
