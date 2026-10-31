import { Link } from "@tanstack/react-router";
import { ShieldCheck } from "lucide-react";

export function SiteNav() {
  const item = "rounded-full px-4 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground";
  const active = "bg-card text-foreground shadow-card";
  return (
    <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <Link to="/" className="flex items-center gap-2 font-display text-lg font-bold">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-brand text-primary-foreground">
            <ShieldCheck className="h-4 w-4" />
          </span>
          Sentinel<span className="text-muted-foreground font-medium">Pay</span>
        </Link>
        <nav className="flex gap-1 rounded-full bg-secondary p-1">
          <Link to="/" className={item} activeProps={{ className: active }} activeOptions={{ exact: true }}>Store</Link>
          <Link to="/dashboard" className={item} activeProps={{ className: active }}>Merchant</Link>
        </nav>
      </div>
    </header>
  );
}
