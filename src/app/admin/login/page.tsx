import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getAdmin } from "@/lib/auth-helpers";
import { getSettings } from "@/lib/settings";
import { Logo } from "@/components/store/logo";
import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = { title: "Admin sign in", robots: { index: false } };

export default async function AdminLoginPage({ searchParams }: PageProps<"/admin/login">) {
  if (await getAdmin()) redirect("/admin");
  const [s, sp] = await Promise.all([getSettings(), searchParams]);
  const next = typeof sp.next === "string" && sp.next.startsWith("/admin") ? sp.next : undefined;
  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/50 px-4 py-12">
      <div className="w-full max-w-md rounded-3xl border bg-background p-8 shadow-sm">
        <Logo name={s.branding.storeName} logoUrl={s.branding.logoUrl} />
        <h1 className="mt-8 text-3xl font-bold">Admin sign in</h1>
        <p className="mt-2 mb-8 text-muted-foreground">Manage orders, products and settings for {s.branding.storeName}.</p>
        <LoginForm area="admin" next={next} />
      </div>
    </main>
  );
}
