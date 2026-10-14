import type { Metadata } from "next";
import Link from "next/link";
import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = { title: "Sign in", robots: { index: false } };

export default async function AccountLoginPage({ searchParams }: PageProps<"/account/login">) {
  const sp = await searchParams;
  const next = typeof sp.next === "string" ? sp.next : undefined;
  return (
    <div className="container-store max-w-lg py-14">
      <h1 className="text-4xl font-bold">Sign in</h1>
      <p className="mt-3 mb-8 text-lg text-muted-foreground">
        See your orders and save your address. You never need an account to order.
      </p>
      <LoginForm area="account" next={next} />
      <p className="mt-8 text-lg">
        New here?{" "}
        <Link href={`/account/register${next ? `?next=${encodeURIComponent(next)}` : ""}`} className="font-semibold underline underline-offset-4">
          Create an account
        </Link>
      </p>
    </div>
  );
}
