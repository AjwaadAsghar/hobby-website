import type { Metadata } from "next";
import Link from "next/link";
import { requireAdminPage } from "@/lib/auth-helpers";
import { PasswordForm } from "./password-form";
import { LoginNameForm } from "./login-name-form";

export const metadata: Metadata = { title: "Change password", robots: { index: false } };

export default async function ChangePasswordPage() {
  const user = await requireAdminPage();
  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/50 px-4 py-12">
      <div className="w-full max-w-md rounded-3xl border bg-background p-8 shadow-sm">
        <h1 className="text-3xl font-bold">{user.mustChangePassword ? "Please choose a new password" : "Change your password"}</h1>
        <p className="mt-2 mb-8 text-muted-foreground">
          {user.mustChangePassword
            ? "You are using the default password. For security, please choose your own before continuing."
            : `Signed in as ${user.email}.`}
        </p>
        <PasswordForm />
        <div className="mt-10 border-t pt-8">
          <h2 className="mb-4 text-xl font-bold">Your sign-in name</h2>
          <LoginNameForm current={user.email} />
        </div>
        {!user.mustChangePassword && (
          <Link href="/admin" className="mt-6 inline-block font-semibold underline underline-offset-4">
            ← Back to dashboard
          </Link>
        )}
      </div>
    </main>
  );
}
