"use server";

import { after } from "next/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-helpers";
import { ORDER_STATUSES } from "@/lib/order-status";
import { CheckoutError, changeOrderStatus, decidePayment } from "@/server/orders";
import { notifyCustomerStatus } from "@/server/notify";

export type ActionResult = { ok?: boolean; error?: string };

const statusSchema = z.object({
  orderId: z.string().min(1).max(40),
  status: z.enum(ORDER_STATUSES),
  courierName: z.string().trim().max(60).optional().default(""),
  trackingNumber: z.string().trim().max(80).optional().default(""),
  note: z.string().trim().max(300).optional().default(""),
});

export async function updateOrderStatus(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const admin = await requireAdmin();
  const parsed = statusSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { error: "Please choose a valid status." };
  const d = parsed.data;
  if (d.status === "SHIPPED" && !d.courierName) return { error: "Please enter the courier name before marking the order as shipped." };
  try {
    const { before, after: updated } = await changeOrderStatus(d.orderId, d.status, {
      actor: admin.name,
      note: d.note,
      courierName: d.status === "SHIPPED" ? d.courierName : undefined,
      trackingNumber: d.status === "SHIPPED" ? d.trackingNumber : undefined,
    });
    if (before.status !== updated.status) after(() => notifyCustomerStatus(d.orderId, d.status));
  } catch (err) {
    if (err instanceof CheckoutError) return { error: `Cannot reopen this order: ${err.message}` };
    console.error(err);
    return { error: "Could not update the order. Please try again." };
  }
  revalidatePath(`/admin/orders/${d.orderId}`);
  revalidatePath("/admin/orders");
  return { ok: true };
}

export async function reviewPayment(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const admin = await requireAdmin();
  const orderId = String(formData.get("orderId") ?? "");
  const decision = formData.get("decision");
  const note = String(formData.get("note") ?? "").slice(0, 300);
  if (!orderId || (decision !== "approve" && decision !== "reject")) return { error: "Invalid request." };
  await decidePayment(orderId, decision === "approve", admin.name, note);
  after(() => notifyCustomerStatus(orderId, decision === "approve" ? "PAYMENT_APPROVED" : "PAYMENT_REJECTED"));
  revalidatePath(`/admin/orders/${orderId}`);
  return { ok: true };
}

export async function saveInternalNotes(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  await requireAdmin();
  const orderId = String(formData.get("orderId") ?? "");
  const notes = String(formData.get("internalNotes") ?? "").slice(0, 5000);
  await db.order.update({ where: { id: orderId }, data: { internalNotes: notes } });
  revalidatePath(`/admin/orders/${orderId}`);
  return { ok: true };
}

export async function markPaidManually(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const admin = await requireAdmin();
  const orderId = String(formData.get("orderId") ?? "");
  await decidePayment(orderId, true, admin.name, "Marked as paid manually");
  revalidatePath(`/admin/orders/${orderId}`);
  return { ok: true };
}
