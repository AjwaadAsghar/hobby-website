import type { StoreSettings } from "@/config/store";
import type { PaymentProvider } from "./types";

const cod: PaymentProvider = {
  id: "cod",
  kind: "offline",
  initialPaymentStatus: "UNPAID",
  isEnabled: (s) => s.payments.cod.enabled,
  publicInfo: (s) => ({
    id: "cod",
    label: "Cash on delivery",
    description: "Pay the courier in cash when your parcel arrives.",
    kind: "offline",
    instructions: s.payments.cod.instructions,
    details: [],
  }),
};

const bank: PaymentProvider = {
  id: "bank",
  kind: "manual_proof",
  initialPaymentStatus: "AWAITING_PAYMENT",
  isEnabled: (s) => s.payments.bank.enabled,
  publicInfo: (s) => ({
    id: "bank",
    label: "Bank transfer",
    description: "Transfer from any bank app, then upload a screenshot.",
    kind: "manual_proof",
    instructions: s.payments.bank.instructions,
    details: [
      { label: "Bank", value: s.payments.bank.account.bankName },
      { label: "Account title", value: s.payments.bank.account.accountTitle },
      { label: "Account number", value: s.payments.bank.account.accountNumber },
      { label: "IBAN", value: s.payments.bank.account.iban },
    ].filter((d) => d.value),
  }),
};

function wallet(id: "jazzcash" | "easypaisa", label: string): PaymentProvider {
  return {
    id,
    kind: "manual_proof",
    initialPaymentStatus: "AWAITING_PAYMENT",
    isEnabled: (s) => s.payments[id].enabled,
    publicInfo: (s) => ({
      id,
      label,
      description: `Send money with ${label}, then upload a screenshot.`,
      kind: "manual_proof",
      instructions: s.payments[id].instructions,
      details: [
        { label: "Account title", value: s.payments[id].account.accountTitle },
        { label: `${label} number`, value: s.payments[id].account.accountNumber },
      ].filter((d) => d.value),
    }),
  };
}

/** Order here = order shown at checkout. Add new gateways to this list. */
export const paymentProviders: PaymentProvider[] = [cod, bank, wallet("jazzcash", "JazzCash"), wallet("easypaisa", "Easypaisa")];

export function getPaymentProvider(id: string): PaymentProvider | undefined {
  return paymentProviders.find((p) => p.id === id);
}

export function getEnabledPaymentMethods(settings: StoreSettings) {
  return paymentProviders.filter((p) => p.isEnabled(settings)).map((p) => p.publicInfo(settings));
}

export function paymentLabel(id: string): string {
  return { cod: "Cash on delivery", bank: "Bank transfer", jazzcash: "JazzCash", easypaisa: "Easypaisa" }[id] ?? id;
}
