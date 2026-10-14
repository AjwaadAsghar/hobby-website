import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requireAdminPage } from "@/lib/auth-helpers";
import { getSettings } from "@/lib/settings";
import { db } from "@/lib/db";
import { AdminShell } from "@/components/admin/admin-shell";
import { NotificationBell } from "@/components/admin/notification-bell";
import { PENDING_STATUSES } from "@/lib/order-status";
import { lowStockCount } from "@/server/admin-stats";

export async function generateMetadata(): Promise<Metadata> {
  const s = await getSettings();
  return {
    title: { default: `Admin | ${s.branding.storeName}`, template: `%s | ${s.branding.storeName} admin` },
    robots: { index: false, follow: false },
    manifest: "/admin/manifest.webmanifest",
  };
}



export default async function AdminPanelLayout({ children }: LayoutProps<"/admin">) {
  const user = await requireAdminPage();
  if (user.mustChangePassword) redirect("/admin/change-password");
  const [s, pendingOrders, lowStock] = await Promise.all([
    getSettings(),
    db.order.count({ where: { OR: [{ status: { in: PENDING_STATUSES } }, { paymentStatus: "AWAITING_VERIFICATION" }] } }),
    lowStockCount(),
  ]);
  return (
    <AdminShell
      storeName={s.branding.storeName}
      user={{ name: user.name, email: user.email, role: user.role }}
      badges={{ pendingOrders, lowStock }}
      topRight={<NotificationBell />}
    >
      {children}
    </AdminShell>
  );
}
