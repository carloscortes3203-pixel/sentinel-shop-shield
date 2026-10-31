import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { DollarSign, ShieldCheck, Activity, FileText, Truck, AlertTriangle, RefreshCw, Webhook } from "lucide-react";
import { SiteNav } from "@/components/SiteNav";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Merchant Dashboard — Sentinel Pay" },
      { name: "description", content: "Fees saved, protected transactions, risk levels and dispute automation in one live view." },
      { property: "og:title", content: "Sentinel Pay Merchant Dashboard" },
      { property: "og:description", content: "Live payment resilience, risk and dispute protection metrics." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Dashboard,
});

const volume = Array.from({ length: 14 }, (_, i) => ({
  day: `Oct ${17 + i}`,
  saved: Math.round(40 + Math.sin(i / 2) * 15 + i * 4),
  volume: Math.round(900 + Math.cos(i / 3) * 200 + i * 60),
}));
const routes = [
  { name: "Mon", micro: 42, standard: 30 }, { name: "Tue", micro: 51, standard: 34 }, { name: "Wed", micro: 47, standard: 39 },
  { name: "Thu", micro: 63, standard: 41 }, { name: "Fri", micro: 72, standard: 48 }, { name: "Sat", micro: 58, standard: 36 }, { name: "Sun", micro: 49, standard: 29 },
];

type Risk = "low" | "medium" | "high";
type LogItem = { id: number; caseId: string; invoice: string; tracking: string; carrier: string; time: string };

const carriers = ["UPS", "FedEx", "USPS", "DHL"];
function makeLog(id: number): LogItem {
  const c = carriers[id % 4];
  return {
    id,
    caseId: `PP-D-${(48210 + id).toString()}`,
    invoice: `INV-2026-${(1040 + id).toString().padStart(5, "0")}.pdf`,
    tracking: `${c === "UPS" ? "1Z" : ""}${Math.random().toString(36).slice(2, 12).toUpperCase()}`,
    carrier: c,
    time: new Date().toLocaleTimeString(),
  };
}

function useCountUp(target: number, ms = 1200) {
  const [v, setV] = useState(0);
  useEffect(() => {
    let raf = 0; const start = performance.now();
    const tick = (t: number) => { const p = Math.min(1, (t - start) / ms); setV(target * (1 - Math.pow(1 - p, 3))); if (p < 1) raf = requestAnimationFrame(tick); };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, ms]);
  return v;
}

function Dashboard() {
  const [saved, setSaved] = useState(4821.36);
  const [protectedTx, setProtectedTx] = useState(12408);
  const [risk, setRisk] = useState<Risk>("low");
  const [score, setScore] = useState(12);
  const [log, setLog] = useState<LogItem[]>([]);
  const [simulating, setSimulating] = useState(false);

  useEffect(() => {
    setLog([3, 2, 1].map(makeLog));
    let n = 4;
    const t = setInterval(() => {
      setSaved((s) => s + Math.random() * 2.4);
      setProtectedTx((p) => p + 1);
      const s = Math.round(Math.random() < 0.7 ? Math.random() * 30 : 30 + Math.random() * 65);
      setScore(s);
      setRisk(s < 33 ? "low" : s < 66 ? "medium" : "high");
      if (Math.random() < 0.6) setLog((l) => [makeLog(n++), ...l].slice(0, 8));
    }, 3000);
    return () => clearInterval(t);
  }, []);

  const savedAnim = useCountUp(saved);
  const txAnim = useCountUp(protectedTx);

  const simulate = () => {
    if (simulating) return;
    setSimulating(true);
    const id = toast.error("500 Internal Server Error — Braintree gateway", { description: "TXN-88412 · $120.00 · Async Retry Engine engaged" });
    const steps: [number, () => void][] = [
      [1200, () => toast.loading("Retry 1/3 · exponential backoff 400ms", { id, description: "Queued via webhook PAYMENT.CAPTURE.PENDING" })],
      [2500, () => toast.loading("Failover → PayPal Orders API v2", { id, description: "Idempotency key preserved · customer session alive" })],
      [3900, () => toast.loading("Awaiting webhook PAYMENT.CAPTURE.COMPLETED…", { id, description: "Transaction held in resilient state" })],
      [5200, () => {
        toast.success("Transaction recovered ✓", { id, description: "Captured via PayPal fallback in 4.8s · 0 customer impact" });
        setProtectedTx((p) => p + 1);
        setSimulating(false);
      }],
    ];
    steps.forEach(([ms, fn]) => setTimeout(fn, ms));
  };

  return (
    <div className="min-h-screen">
      <SiteNav />
      <main className="mx-auto max-w-7xl space-y-6 px-6 py-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Merchant overview · Live</p>
            <h1 className="text-3xl font-bold">Payments health</h1>
          </div>
          <button
            onClick={simulate}
            disabled={simulating}
            className="inline-flex items-center gap-2 rounded-xl bg-destructive px-5 py-3 text-sm font-semibold text-destructive-foreground shadow-glow transition hover:-translate-y-0.5 disabled:opacity-70"
          >
            {simulating ? <RefreshCw className="h-4 w-4 animate-spin" /> : <AlertTriangle className="h-4 w-4" />}
            Simulate 500 API Error (Braintree/PayPal Fallback)
          </button>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Metric icon={DollarSign} label="Total Fees Saved" value={`$${savedAnim.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} delta="+12.4% vs last week" />
          <Metric icon={ShieldCheck} label="Transactions Protected" value={Math.round(txAnim).toLocaleString()} delta="+318 today" />
          <Metric icon={Activity} label="API Resilience Rate" value="99.9%" delta="0 failed checkouts · 30d" />
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <Panel title="Fees saved & volume" className="lg:col-span-2">
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={volume}>
                <defs>
                  <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="g2" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--chart-2)" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="var(--chart-2)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="var(--border)" vertical={false} />
                <XAxis dataKey="day" tickLine={false} axisLine={false} fontSize={12} stroke="var(--muted-foreground)" />
                <YAxis yAxisId="l" tickLine={false} axisLine={false} fontSize={12} stroke="var(--muted-foreground)" />
                <YAxis yAxisId="r" orientation="right" hide />
                <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid var(--border)", background: "var(--card)" }} />
                <Area yAxisId="r" type="monotone" dataKey="volume" stroke="var(--chart-2)" fill="url(#g2)" strokeWidth={2} />
                <Area yAxisId="l" type="monotone" dataKey="saved" stroke="var(--chart-1)" fill="url(#g1)" strokeWidth={2.5} />
              </AreaChart>
            </ResponsiveContainer>
          </Panel>

          <Panel title="Auth Guard risk">
            <TrafficLight risk={risk} score={score} />
          </Panel>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <Panel title="Anti-180 Days Protection Status" className="lg:col-span-2" right={<span className="flex items-center gap-1.5 text-xs font-medium text-success"><span className="h-2 w-2 rounded-full bg-success animate-pulse" /> Disputes API live</span>}>
            <div className="divide-y">
              {log.map((l) => (
                <div key={l.id} className="animate-rise grid grid-cols-[auto_1fr_auto] items-center gap-4 py-3 text-sm">
                  <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary/10 text-primary"><FileText className="h-4 w-4" /></span>
                  <div className="min-w-0">
                    <p className="truncate font-medium">{l.caseId} · evidence injected</p>
                    <p className="flex flex-wrap gap-x-3 font-mono text-xs text-muted-foreground">
                      <span>{l.invoice}</span>
                      <span className="flex items-center gap-1"><Truck className="h-3 w-3" />{l.carrier} {l.tracking}</span>
                    </p>
                  </div>
                  <span className="text-xs text-muted-foreground">{l.time}</span>
                </div>
              ))}
            </div>
          </Panel>

          <Panel title="Route mix (7d)">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={routes}>
                <CartesianGrid stroke="var(--border)" vertical={false} />
                <XAxis dataKey="name" tickLine={false} axisLine={false} fontSize={12} stroke="var(--muted-foreground)" />
                <Tooltip cursor={{ fill: "var(--secondary)" }} contentStyle={{ borderRadius: 12, border: "1px solid var(--border)", background: "var(--card)" }} />
                <Bar dataKey="micro" stackId="a" fill="var(--chart-3)" radius={[0, 0, 4, 4]} />
                <Bar dataKey="standard" stackId="a" fill="var(--chart-1)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
            <div className="mt-2 flex gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-sm bg-chart-3" />Micro-fee</span>
              <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-sm bg-chart-1" />Standard</span>
              <span className="ml-auto flex items-center gap-1"><Webhook className="h-3 w-3" /> webhooks 100%</span>
            </div>
          </Panel>
        </div>
      </main>
    </div>
  );
}

function Metric({ icon: Icon, label, value, delta }: { icon: typeof DollarSign; label: string; value: string; delta: string }) {
  return (
    <div className="animate-rise rounded-2xl border bg-card p-5 shadow-card">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{label}</p>
        <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-brand text-primary-foreground"><Icon className="h-4 w-4" /></span>
      </div>
      <p className="mt-3 font-display text-3xl font-bold tabular-nums">{value}</p>
      <p className="mt-1 text-xs font-medium text-success">{delta}</p>
    </div>
  );
}

function Panel({ title, children, className = "", right }: { title: string; children: React.ReactNode; className?: string; right?: React.ReactNode }) {
  return (
    <section className={`animate-rise rounded-2xl border bg-card p-5 shadow-card ${className}`}>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-base font-semibold">{title}</h2>
        {right}
      </div>
      {children}
    </section>
  );
}

function TrafficLight({ risk, score }: { risk: Risk; score: number }) {
  const lights: { key: Risk; label: string; on: string }[] = [
    { key: "high", label: "High", on: "bg-destructive text-destructive/40" },
    { key: "medium", label: "Medium", on: "bg-warning text-warning/40" },
    { key: "low", label: "Low", on: "bg-success text-success/40" },
  ];
  const text = { low: "Low Risk", medium: "Medium Risk", high: "High Risk" }[risk];
  const tone = { low: "text-success", medium: "text-warning-foreground", high: "text-destructive" }[risk];
  return (
    <div className="flex items-center gap-6">
      <div className="flex flex-col gap-3 rounded-3xl bg-ink p-3">
        {lights.map((l) => (
          <span key={l.key} className={`h-12 w-12 rounded-full transition-all duration-500 ${risk === l.key ? `${l.on} animate-pulse-ring` : "bg-ink-foreground/10"}`} />
        ))}
      </div>
      <div>
        <p className={`font-display text-2xl font-bold ${tone}`}>{text}</p>
        <p className="mt-1 text-sm text-muted-foreground">Risk score <span className="font-mono font-semibold text-foreground">{score}</span>/100</p>
        <div className="mt-3 h-2 w-40 overflow-hidden rounded-full bg-secondary">
          <div className="h-full bg-gradient-brand transition-all duration-700" style={{ width: `${score}%` }} />
        </div>
        <p className="mt-3 text-xs text-muted-foreground">Device, velocity & 3DS signals · updates every 3s</p>
      </div>
    </div>
  );
}
