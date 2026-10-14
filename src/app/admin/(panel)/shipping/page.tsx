import Link from "next/link";
import { db } from "@/lib/db";
import { parseJson } from "@/lib/json";
import { getSettings } from "@/lib/settings";
import { formatMoney } from "@/lib/money";
import { PageHeader } from "@/components/admin/admin-shell";
import { ZonesEditor } from "./zones-editor";

export const metadata = { title: "Shipping" };

export default async function ShippingPage() {
  const [zones, s] = await Promise.all([db.shippingZone.findMany({ orderBy: { sortOrder: "asc" } }), getSettings()]);
  const fmt = { currency: s.commerce.currency, locale: s.commerce.locale };
  return (
    <div className="max-w-5xl">
      <PageHeader title="Shipping" description="Delivery charges by city. The customer sees the charge as soon as they type their city at checkout." />
      <div className="mb-6 rounded-2xl border bg-card p-5 shadow-sm">
        <p className="text-lg">
          Free delivery on orders over <strong>{s.commerce.freeShippingThreshold > 0 ? formatMoney(s.commerce.freeShippingThreshold, fmt) : "(turned off)"}</strong>.{" "}
          <Link href="/admin/settings?tab=store" className="font-semibold underline underline-offset-4">
            Change
          </Link>
        </p>
      </div>
      <ZonesEditor
        currency={s.commerce.currency}
        initial={zones.map((z) => ({ id: z.id, name: z.name, cities: parseJson<string[]>(z.cities, []).join(", "), rate: String(z.rate / 100), isDefault: z.isDefault }))}
      />
    </div>
  );
}
