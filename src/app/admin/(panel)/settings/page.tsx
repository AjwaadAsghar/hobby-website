import Link from "next/link";
import { requireAdminPage } from "@/lib/auth-helpers";
import { getSettings } from "@/lib/settings";
import { PageHeader } from "@/components/admin/admin-shell";
import { BrandingForm, CommerceForm, ContactForm, HomepageForm, NotificationsForm, PaymentsForm } from "./settings-forms";
import { cn } from "@/lib/utils";

export const metadata = { title: "Settings" };

const tabs = [
  { id: "branding", label: "Branding" },
  { id: "contact", label: "Contact & social" },
  { id: "store", label: "Currency & delivery" },
  { id: "payments", label: "Payments" },
  { id: "notifications", label: "Notifications" },
  { id: "homepage", label: "Homepage" },
] as const;

export default async function SettingsPage({ searchParams }: PageProps<"/admin/settings">) {
  await requireAdminPage(["OWNER"]);
  const sp = await searchParams;
  const tab = tabs.find((t) => t.id === sp.tab)?.id ?? "branding";
  const s = await getSettings();

  return (
    <div className="max-w-4xl">
      <PageHeader
        title="Settings"
        description="Changes apply to the whole store as soon as you save."
        actions={
          <Link href="/admin/settings/integrations" className="inline-flex h-11 items-center rounded-xl border-2 border-input bg-background px-4 font-semibold hover:bg-muted">
            Integrations
          </Link>
        }
      />
      <nav aria-label="Settings sections" className="mb-6 flex flex-wrap gap-2">
        {tabs.map((t) => (
          <Link
            key={t.id}
            href={`/admin/settings?tab=${t.id}`}
            aria-current={tab === t.id ? "page" : undefined}
            className={cn("rounded-full border px-4 py-2 font-semibold", tab === t.id ? "border-foreground bg-foreground text-background" : "bg-background hover:bg-muted")}
          >
            {t.label}
          </Link>
        ))}
      </nav>
      {tab === "branding" && <BrandingForm initial={s.branding} />}
      {tab === "contact" && <ContactForm initial={s.contact} />}
      {tab === "store" && <CommerceForm initial={s.commerce} />}
      {tab === "payments" && <PaymentsForm initial={s.payments} />}
      {tab === "notifications" && <NotificationsForm initial={s.notifications} />}
      {tab === "homepage" && <HomepageForm initial={s.homepage} />}
    </div>
  );
}
