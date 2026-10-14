"use client";

import { useActionState } from "react";
import { addAdmin, updateAdmin, type UserState } from "./actions";
import { adminInput } from "@/components/admin/fields";

function TempPassword({ pw }: { pw?: string }) {
  if (!pw) return null;
  return (
    <div role="status" className="rounded-xl border-2 border-success/50 bg-success/10 p-4">
      <p className="font-semibold">Temporary password (shown only once):</p>
      <p className="mt-1 font-mono text-xl font-bold tracking-wider select-all">{pw}</p>
      <p className="mt-1 text-sm">Send it to them privately. They will be asked to choose their own password when they first sign in.</p>
    </div>
  );
}

export function AddAdminForm() {
  const [state, action, pending] = useActionState<UserState, FormData>(addAdmin, {});
  const fe = state.fieldErrors ?? {};
  return (
    <form action={action} className="space-y-4" noValidate>
      <TempPassword pw={state.tempPassword} />
      <div>
        <label htmlFor="u-name" className="mb-1.5 block font-semibold">
          Name
        </label>
        <input id="u-name" name="name" className={adminInput(fe.name)} />
        {fe.name && <p className="mt-1 font-medium text-destructive">{fe.name}</p>}
      </div>
      <div>
        <label htmlFor="u-email" className="mb-1.5 block font-semibold">
          Email
        </label>
        <input id="u-email" name="email" type="email" className={adminInput(fe.email)} />
        {fe.email && <p className="mt-1 font-medium text-destructive">{fe.email}</p>}
      </div>
      <fieldset>
        <legend className="mb-1.5 font-semibold">Role</legend>
        <label className="flex items-start gap-3 py-1">
          <input type="radio" name="role" value="STAFF" defaultChecked className="mt-1 size-5 accent-[var(--brand)]" />
          <span>
            <span className="block font-semibold">Staff</span>
            <span className="block text-sm text-muted-foreground">Orders, products, inventory, customers, discounts and shipping.</span>
          </span>
        </label>
        <label className="flex items-start gap-3 py-1">
          <input type="radio" name="role" value="OWNER" className="mt-1 size-5 accent-[var(--brand)]" />
          <span>
            <span className="block font-semibold">Owner</span>
            <span className="block text-sm text-muted-foreground">Everything, including settings, integrations and admin users.</span>
          </span>
        </label>
      </fieldset>
      <button disabled={pending} className="h-12 w-full rounded-xl bg-brand font-semibold text-brand-foreground disabled:opacity-60">
        {pending ? "Adding…" : "Add admin"}
      </button>
    </form>
  );
}

export function UserActions({ id, role, isActive, isMe }: { id: string; role: string; isActive: boolean; isMe: boolean }) {
  const [state, action, pending] = useActionState<UserState, FormData>(updateAdmin, {});
  const btn = "h-10 rounded-lg border-2 border-input px-3 text-sm font-semibold hover:bg-muted disabled:opacity-40";
  return (
    <div className="space-y-2">
      <form action={action} className="flex flex-wrap justify-end gap-2">
        <input type="hidden" name="id" value={id} />
        <button name="action" value="reset" disabled={pending} className={btn}>
          Reset password
        </button>
        {role === "STAFF" ? (
          <button name="action" value="make-owner" disabled={pending} className={btn}>
            Make owner
          </button>
        ) : (
          <button name="action" value="make-staff" disabled={pending || isMe} className={btn}>
            Make staff
          </button>
        )}
        {isActive ? (
          <button name="action" value="deactivate" disabled={pending || isMe} className={`${btn} text-destructive`}>
            Deactivate
          </button>
        ) : (
          <button name="action" value="activate" disabled={pending} className={btn}>
            Reactivate
          </button>
        )}
      </form>
      {state.error && <p className="text-right text-sm font-medium text-destructive">{state.error}</p>}
      <TempPassword pw={state.tempPassword} />
    </div>
  );
}
