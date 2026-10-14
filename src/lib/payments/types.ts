import type { StoreSettings } from "@/config/store";

/**
 * Payment provider interface.
 *
 * Checkout never talks to a payment method directly - it only uses this
 * interface. To add a card gateway (Safepay, PayFast, ...), create a file like
 * `card-gateway.example.ts`, implement `initiate` (create a payment session and
 * return the URL to send the customer to) and `verifyCallback`, then add it to
 * the list in `registry.ts`. Nothing in checkout needs to change.
 */
export type PaymentKind =
  /** Pay later, e.g. cash on delivery */
  | "offline"
  /** Customer pays manually and uploads a screenshot for us to check */
  | "manual_proof"
  /** Customer is sent to a gateway's hosted payment page */
  | "redirect";

export type PaymentPublicInfo = {
  id: string;
  label: string;
  description: string;
  kind: PaymentKind;
  instructions: string;
  /** Account details to show, e.g. bank name, IBAN */
  details: { label: string; value: string }[];
};

export type OrderForPayment = {
  id: string;
  number: number;
  total: number;
  currency: string;
  customerName: string;
  phone: string;
  email: string | null;
  accessToken: string;
};

export interface PaymentProvider {
  id: string;
  kind: PaymentKind;
  isEnabled(settings: StoreSettings): boolean;
  publicInfo(settings: StoreSettings): PaymentPublicInfo;
  /** Payment status a new order starts with. */
  initialPaymentStatus: "UNPAID" | "AWAITING_PAYMENT";
  /** Redirect gateways only: start a payment and return where to send the customer. */
  initiate?(order: OrderForPayment, ctx: { returnUrl: string; cancelUrl: string }): Promise<{ redirectUrl: string }>;
  /** Redirect gateways only: check a callback/webhook and say whether the order is paid. */
  verifyCallback?(request: Request): Promise<{ orderNumber: number; paid: boolean; reference?: string }>;
}
