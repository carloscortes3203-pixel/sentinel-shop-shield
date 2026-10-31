import { useState } from "react";
import { ClientOnly } from "@tanstack/react-router";
import { DISPATCH_ACTION, PayPalButtons, PayPalScriptProvider, usePayPalScriptReducer } from "@paypal/react-paypal-js";
import { Lock, LoaderCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { createCheckoutHandlers, PAYPAL_OPTIONS } from "@/lib/paypal";
import type { Product } from "@/lib/pricing";

export function PayPalCheckout({ product }: { product: Product }) {
  return (
    <div id="paypal-button-container" className="mt-6 space-y-3 rounded-xl border border-dashed p-4">
      <p className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground"><Lock className="h-3 w-3" /> PayPal · Test checkout · USD</p>
      <ClientOnly fallback={<Loading />}>
        <PayPalScriptProvider options={PAYPAL_OPTIONS}>
          <CheckoutButtons key={product.id} product={product} />
        </PayPalScriptProvider>
      </ClientOnly>
    </div>
  );
}

function Loading() {
  return <p role="status" className="flex min-h-12 items-center gap-2 text-sm text-muted-foreground"><LoaderCircle className="h-4 w-4 animate-spin" /> Loading PayPal…</p>;
}

function CheckoutButtons({ product }: { product: Product }) {
  const [{ isPending, isRejected }, dispatch] = usePayPalScriptReducer();
  const [error, setError] = useState("");
  const [receipt, setReceipt] = useState("");
  const handlers = createCheckoutHandlers(product, (orderId) => {
    setError("");
    setReceipt(orderId);
    toast.success(`Test payment completed: $${product.price.toFixed(2)} USD`, { description: `PayPal order: ${orderId}` });
  });

  if (isRejected) return (
    <div className="space-y-3">
      <p role="alert" className="text-sm text-destructive">PayPal could not load. Please retry or check the Sandbox Client ID.</p>
      <Button variant="outline" onClick={() => dispatch({ type: DISPATCH_ACTION.RESET_OPTIONS, value: PAYPAL_OPTIONS })}>Retry PayPal</Button>
    </div>
  );

  return (
    <div className="space-y-3">
      {isPending && <Loading />}
      <PayPalButtons
        style={{ layout: "vertical", shape: "rect", label: "paypal", height: 45 }}
        forceReRender={[product.id, product.price]}
        {...handlers}
        onClick={() => { setError(""); setReceipt(""); }}
        onCancel={() => { toast.info("PayPal checkout cancelled. No payment completed."); }}
        onError={() => {
          setError("PayPal could not complete this test payment. Check your PayPal account activity before retrying.");
          toast.error("PayPal test payment failed.");
        }}
      />
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      {receipt && <p role="status" className="break-all text-sm text-success">Test payment completed · Order {receipt}</p>}
    </div>
  );
}