import type { PayPalButtonsComponentProps, ReactPayPalScriptOptions } from "@paypal/react-paypal-js";
import type { Product } from "@/lib/pricing";

export const PAYPAL_OPTIONS: ReactPayPalScriptOptions = {
  clientId: "BAAExrhRc6oupuy4uVTGJ6L-0rAiiLJEb_mO956j4V_mfzOIWtD8LPu1EqgjRcKqf1kvCRJOiGF9AYvF-o",
  currency: "USD",
  intent: "capture",
  components: "buttons",
};

export function createCheckoutHandlers(
  product: Product,
  onCaptured: (orderId: string) => void,
): Pick<PayPalButtonsComponentProps, "createOrder" | "onApprove"> {
  return {
    createOrder: (_data, actions) => actions.order.create({
      intent: "CAPTURE",
      purchase_units: [{
        reference_id: product.id,
        description: product.name,
        amount: { currency_code: "USD", value: product.price.toFixed(2) },
      }],
    }),
    onApprove: async (data, actions) => {
      if (!actions.order) throw new Error("PayPal capture is unavailable.");
      const order = await actions.order.capture();
      if (order.status !== "COMPLETED") {
        throw new Error("PayPal has not completed this payment.");
      }
      onCaptured(order.id || data.orderID);
    },
  };
}