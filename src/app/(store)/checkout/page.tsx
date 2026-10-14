import type { Metadata } from "next";
import { getSettings } from "@/lib/settings";
import { getEnabledPaymentMethods } from "@/lib/payments/registry";
import { db } from "@/lib/db";
import { parseJson } from "@/lib/json";
import { getCustomer } from "@/lib/auth-helpers";
import { CheckoutForm } from "./checkout-form";

export const metadata: Metadata = { title: "Checkout", robots: { index: false } };

export default async function CheckoutPage() {
  const [s, zones, customer] = await Promise.all([getSettings(), db.shippingZone.findMany(), getCustomer()]);
  const methods = getEnabledPaymentMethods(s);
  const cities = [...new Set(zones.flatMap((z) => parseJson<string[]>(z.cities, [])))].sort();
  const addresses =
    customer?.role === "CUSTOMER"
      ? await db.address.findMany({ where: { userId: customer.id }, orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }] })
      : [];

  return (
    <CheckoutForm
      methods={methods}
      cities={cities}
      signedIn={customer?.role === "CUSTOMER"}
      customer={customer?.role === "CUSTOMER" ? { name: customer.name, email: customer.email, phone: customer.phone ?? "" } : null}
      addresses={addresses.map((a) => ({ id: a.id, label: a.label, name: a.name, phone: a.phone, address: a.address, city: a.city }))}
    />
  );
}
