"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  BarChart3,
  Boxes,
  ExternalLink,
  FileText,
  LayoutDashboard,
  LogOut,
  Mails,
  Menu,
  Package,
  Plug,
  Settings,
  ShoppingBag,
  Tag,
  Truck,
  UserCog,
  Users,
} from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { logoutAction } from "@/server/auth-actions";
import { cn } from "@/lib/utils";

type NavItem = { href: string; label: string; icon: typeof Package; ownerOnly?: boolean; badgeKey?: "pendingOrders" | "lowStock" };

const nav: { group: string; items: NavItem[] }[] = [
  {
    group: "Store",
    items: [
      { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
      { href: "/admin/orders", label: "Orders", icon: ShoppingBag, badgeKey: "pendingOrders" },
      { href: "/admin/products", label: "Products", icon: Package },
      { href: "/admin/inventory", label: "Inventory", icon: Boxes, badgeKey: "lowStock" },
      { href: "/admin/customers", label: "Customers", icon: Users },
      { href: "/admin/reports", label: "Reports", icon: BarChart3 },
    ],
  },
  {
    group: "Selling",
    items: [
      { href: "/admin/discounts", label: "Discount codes", icon: Tag },
      { href: "/admin/shipping", label: "Shipping", icon: Truck },
      { href: "/admin/categories", label: "Categories", icon: Boxes },
      { href: "/admin/pages", label: "Pages", icon: FileText },
    ],
  },
  {
    group: "Setup",
    items: [
      { href: "/admin/settings", label: "Settings", icon: Settings, ownerOnly: true },
      { href: "/admin/settings/integrations", label: "Integrations", icon: Plug, ownerOnly: true },
      { href: "/admin/emails", label: "Email log", icon: Mails },
      { href: "/admin/users", label: "Admin users", icon: UserCog, ownerOnly: true },
    ],
  },
];

function NavList({ role, badges, onNavigate }: { role: string; badges: Record<string, number>; onNavigate?: () => void }) {
  const pathname = usePathname();
  const isActive = (href: string) =>
    href === "/admin" ? pathname === "/admin" : pathname === href || (pathname.startsWith(href + "/") && !(href === "/admin/settings" && pathname.startsWith("/admin/settings/integrations")));
  return (
    <nav aria-label="Admin" className="space-y-4">
      {nav.map((g) => (
        <div key={g.group}>
          <p className="mb-1.5 px-3 text-xs font-bold tracking-wider text-muted-foreground uppercase">{g.group}</p>
          <ul className="space-y-0.5">
            {g.items
              .filter((i) => !i.ownerOnly || role === "OWNER")
              .map((i) => {
                const active = isActive(i.href);
                const badge = i.badgeKey ? badges[i.badgeKey] : 0;
                return (
                  <li key={i.href}>
                    <Link
                      href={i.href}
                      onClick={onNavigate}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "flex h-10 items-center gap-3 rounded-xl px-3 text-[0.95rem] font-medium transition-colors",
                        active ? "bg-foreground text-background" : "hover:bg-sidebar-accent",
                      )}
                    >
                      <i.icon className="size-5 shrink-0" aria-hidden />
                      <span className="flex-1">{i.label}</span>
                      {badge > 0 && (
                        <span className={cn("rounded-full px-2 py-0.5 text-xs font-bold", active ? "bg-background text-foreground" : "bg-brand text-brand-foreground")}>
                          {badge}
                          <span className="sr-only"> need attention</span>
                        </span>
                      )}
                    </Link>
                  </li>
                );
              })}
          </ul>
        </div>
      ))}
    </nav>
  );
}

export function AdminShell({
  storeName,
  user,
  badges,
  topRight,
  children,
}: {
  storeName: string;
  user: { name: string; email: string; role: string };
  badges: Record<string, number>;
  topRight?: React.ReactNode;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="flex min-h-screen bg-muted/40">
      <a href="#admin-main" className="skip-link">
        Skip to content
      </a>
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r bg-sidebar lg:flex">
        <div className="border-b px-5 py-4">
          <Link href="/admin" className="block truncate text-lg font-extrabold">
            {storeName}
          </Link>
          <p className="text-sm text-muted-foreground">Admin</p>
        </div>
        <div className="flex-1 overflow-y-auto px-3 py-4">
          <NavList role={user.role} badges={badges} />
        </div>
        <div className="border-t p-3">
          <p className="truncate px-2 text-sm font-semibold">{user.name}</p>
          <p className="truncate px-2 text-xs text-muted-foreground">
            {user.email} · {user.role === "OWNER" ? "Owner" : "Staff"}
          </p>
          <div className="mt-2 flex gap-1">
            <Link href="/admin/change-password" className="flex-1 rounded-lg px-2 py-2 text-center text-sm font-medium hover:bg-sidebar-accent">
              Login &amp; password
            </Link>
            <form action={logoutAction} className="flex-1">
              <input type="hidden" name="area" value="admin" />
              <button className="flex w-full items-center justify-center gap-1.5 rounded-lg px-2 py-2 text-sm font-medium hover:bg-sidebar-accent">
                <LogOut className="size-4" aria-hidden /> Sign out
              </button>
            </form>
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b bg-background/95 px-4 backdrop-blur sm:px-6">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <button className="inline-flex h-11 items-center gap-2 rounded-xl border-2 border-input px-3 font-semibold lg:hidden">
                <Menu className="size-5" aria-hidden /> Menu
              </button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 overflow-y-auto p-0">
              <SheetHeader className="border-b px-5 py-4">
                <SheetTitle>{storeName} admin</SheetTitle>
              </SheetHeader>
              <div className="px-3 py-4">
                <NavList role={user.role} badges={badges} onNavigate={() => setOpen(false)} />
                <form action={logoutAction} className="mt-6 px-3">
                  <input type="hidden" name="area" value="admin" />
                  <button className="h-11 w-full rounded-xl border-2 border-input font-semibold">Sign out</button>
                </form>
              </div>
            </SheetContent>
          </Sheet>
          <span className="truncate font-bold lg:hidden">{storeName}</span>
          <div className="ml-auto flex items-center gap-2">
            {topRight}
            <Link href="/" target="_blank" className="hidden h-11 items-center gap-2 rounded-xl px-3 font-medium hover:bg-muted sm:inline-flex">
              <ExternalLink className="size-4" aria-hidden /> View store
            </Link>
          </div>
        </header>
        <main id="admin-main" tabIndex={-1} className="flex-1 px-4 py-6 outline-none sm:px-6 lg:px-8">
          {children}
        </main>
      </div>
    </div>
  );
}

export function PageHeader({ title, description, actions }: { title: string; description?: string; actions?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-3xl font-bold">{title}</h1>
        {description && <p className="mt-1 text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}
