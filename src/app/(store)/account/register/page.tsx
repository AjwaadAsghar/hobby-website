import type { Metadata } from "next";
import Link from "next/link";
import { RegisterForm } from "./register-form";

export const metadata: Metadata = { title: "Create an account", robots: { index: false } };

export default async function RegisterPage({ searchParams }: PageProps<"/account/register">) {
  const sp = await searchParams;
  const next = typeof sp.next === "string" ? sp.next : undefined;
  return (
    <div className="container-store max-w-lg py-14">
      <h1 className="text-4xl font-bold">Create an account</h1>
      <p className="mt-3 mb-8 text-lg text-muted-foreground">Save your address for faster checkout and see all your orders in one place.</p>
      <RegisterForm next={next} />
      <p className="mt-8 text-lg">
        Already have an account?{" "}
        <Link href="/account/login" className="font-semibold underline underline-offset-4">
          Sign in
        </Link>
      </p>
    </div>
  );
}
