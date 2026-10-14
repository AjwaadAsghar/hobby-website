import { db } from "@/lib/db";
import { requireAdminPage } from "@/lib/auth-helpers";
import { formatDate } from "@/lib/format";
import { PageHeader } from "@/components/admin/admin-shell";
import { Panel } from "@/components/admin/badges";
import { AddAdminForm, UserActions } from "./user-forms";

export const metadata = { title: "Admin users" };

export default async function UsersPage() {
  const me = await requireAdminPage(["OWNER"]);
  const users = await db.user.findMany({ where: { role: { in: ["OWNER", "STAFF"] } }, orderBy: [{ role: "asc" }, { createdAt: "asc" }] });
  return (
    <>
      <PageHeader title="Admin users" description="People who can sign in to this admin." />
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_400px]">
        <ul className="divide-y rounded-2xl border bg-card shadow-sm">
          {users.map((u) => (
            <li key={u.id} className="flex flex-wrap items-start justify-between gap-4 p-5">
              <div>
                <p className="font-semibold">
                  {u.name} {u.id === me.id && <span className="text-muted-foreground">(you)</span>}
                </p>
                <p className="text-sm text-muted-foreground">{u.email}</p>
                <p className="mt-1 flex flex-wrap gap-2 text-sm">
                  <span className="rounded-full bg-muted px-2.5 py-0.5 font-semibold">{u.role === "OWNER" ? "Owner" : "Staff"}</span>
                  {!u.isActive && <span className="rounded-full bg-red-100 px-2.5 py-0.5 font-semibold text-red-900 dark:bg-red-950 dark:text-red-200">Deactivated</span>}
                  {u.mustChangePassword && <span className="rounded-full bg-amber-100 px-2.5 py-0.5 font-semibold text-amber-900 dark:bg-amber-950 dark:text-amber-200">Must change password</span>}
                  <span className="text-muted-foreground">Last sign-in: {u.lastLoginAt ? formatDate(u.lastLoginAt, true) : "never"}</span>
                </p>
              </div>
              <UserActions id={u.id} role={u.role} isActive={u.isActive} isMe={u.id === me.id} />
            </li>
          ))}
        </ul>
        <Panel title="Add an admin">
          <AddAdminForm />
        </Panel>
      </div>
    </>
  );
}
