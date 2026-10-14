import "server-only";
import crypto from "node:crypto";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { normalizePhone } from "@/lib/format";
import { getSettings } from "@/lib/settings";
import { getPaymentProvider } from "@/lib/payments/registry";
import { quoteCart } from "@/server/pricing";
import type { CheckoutInput } from "@/lib/validation/checkout";
import { ORDER_STATUSES } from "@/lib/order-status";

export class CheckoutError extends Error {
  problems: string[];
  constructor(message: string, problems: string[] = []) {
    super(message);
    this.problems = problems;
  }
}

type Tx = Prisma.TransactionClient;
type LowStockItem = { title: string; stock: number; threshold: number; productId: string };

/**
 * Takes stock atomically: the UPDATE only succeeds while enough stock is left,
 * so two customers can never buy the last item and stock never goes negative.
 */
async function takeStock(tx: Tx, line: { productId: string; variantId: string | null; qty: number; title: string }): Promise<LowStockItem | null> {
  if (line.variantId) {
    const res = await tx.productVariant.updateMany({ where: { id: line.variantId, stock: { gte: line.qty } }, data: { stock: { decrement: line.qty } } });
    if (res.count === 0) throw new CheckoutError(`Sorry, "${line.title}" just sold out or has fewer items left than you asked for. Please check your cart.`);
    const v = await tx.productVariant.findUnique({ where: { id: line.variantId }, include: { product: { select: { lowStockThreshold: true } } } });
    if (v && v.stock <= v.product.lowStockThreshold && v.stock + line.qty > v.product.lowStockThreshold) {
      return { title: `${line.title} (${v.name})`, stock: v.stock, threshold: v.product.lowStockThreshold, productId: line.productId };
    }
  } else {
    const res = await tx.product.updateMany({ where: { id: line.productId, stock: { gte: line.qty } }, data: { stock: { decrement: line.qty } } });
    if (res.count === 0) throw new CheckoutError(`Sorry, "${line.title}" just sold out or has fewer items left than you asked for. Please check your cart.`);
    const p = await tx.product.findUnique({ where: { id: line.productId }, select: { stock: true, lowStockThreshold: true } });
    if (p && p.stock <= p.lowStockThreshold && p.stock + line.qty > p.lowStockThreshold) {
      return { title: line.title, stock: p.stock, threshold: p.lowStockThreshold, productId: line.productId };
    }
  }
  return null;
}

async function nextOrderNumber(tx: Tx) {
  const agg = await tx.order.aggregate({ _max: { number: true } });
  return Math.max(10000, agg._max.number ?? 10000) + 1;
}

export async function createOrder(input: CheckoutInput, userId: string | null) {
  const settings = await getSettings();
  const provider = getPaymentProvider(input.paymentMethod);
  if (!provider || !provider.isEnabled(settings)) {
    throw new CheckoutError("That payment method is not available. Please choose another one.");
  }

  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      return await db.$transaction(
        async (tx) => {
          const quote = await quoteCart({ lines: input.lines, discountCode: input.discountCode, city: input.city }, tx);
          const requested = new Map(input.lines.map((l) => [`${l.productId}:${l.variantId ?? "-"}`, l.qty]));
          const changed = quote.lines.some((l) => l.qty !== requested.get(l.key)) || quote.lines.length !== requested.size;
          if (changed || quote.problems.length) {
            throw new CheckoutError("Some items in your cart changed. Please review your cart and try again.", quote.problems);
          }
          if (!quote.lines.length) throw new CheckoutError("Your cart is empty.");
          if (input.discountCode && quote.discount && !quote.discount.valid) throw new CheckoutError(quote.discount.message);

          const lowStock: LowStockItem[] = [];
          for (const l of quote.lines) {
            const low = await takeStock(tx, { productId: l.productId, variantId: l.variantId, qty: l.qty, title: l.title });
            if (low) lowStock.push(low);
            await tx.product.update({ where: { id: l.productId }, data: { soldCount: { increment: l.qty } } });
          }

          if (quote.discountId && quote.discount?.valid) {
            const used = await tx.discountCode.updateMany({
              where: { id: quote.discountId, isActive: true, OR: [{ usageLimit: null }, { usedCount: { lt: tx.discountCode.fields.usageLimit } }] },
              data: { usedCount: { increment: 1 } },
            });
            if (used.count === 0) throw new CheckoutError("This discount code has just been fully used. Please remove it and try again.");
          }

          const number = await nextOrderNumber(tx);
          const order = await tx.order.create({
            data: {
              number,
              accessToken: crypto.randomBytes(18).toString("base64url"),
              userId,
              customerName: input.name,
              phone: input.phone,
              phoneNormalized: normalizePhone(input.phone),
              email: input.email || null,
              address: input.address,
              city: input.city,
              notes: input.notes ?? "",
              paymentMethod: provider.id,
              paymentStatus: provider.initialPaymentStatus,
              subtotal: quote.subtotal,
              discountTotal: quote.discount?.valid ? quote.discount.amount : 0,
              discountCode: quote.discount?.valid ? quote.discount.code : null,
              shippingTotal: quote.shipping?.amount ?? 0,
              shippingZone: quote.shipping?.zone ?? null,
              total: quote.total,
              items: {
                create: quote.lines.map((l) => ({
                  productId: l.productId,
                  variantId: l.variantId,
                  title: l.title,
                  variantName: l.variantName,
                  sku: l.sku,
                  image: l.image,
                  unitPrice: l.unitPrice,
                  unitCost: l.unitCost,
                  quantity: l.qty,
                  lineTotal: l.lineTotal,
                })),
              },
              history: { create: { status: "NEW", note: "Order placed", actor: "customer" } },
            },
          });

          if (userId && input.saveAddress) {
            const exists = await tx.address.findFirst({ where: { userId, address: input.address, city: input.city } });
            if (!exists) {
              const count = await tx.address.count({ where: { userId } });
              await tx.address.create({ data: { userId, name: input.name, phone: input.phone, address: input.address, city: input.city, isDefault: count === 0 } });
            }
          }
          return { order, lowStock, provider };
        },
        { timeout: 15000 },
      );
    } catch (err) {
      // Two orders grabbed the same number at the same moment - try again.
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002" && attempt < 3) continue;
      throw err;
    }
  }
  throw new CheckoutError("We could not place your order. Please try again.");
}

/** Puts stock back exactly once (cancel / return). */
async function restoreStock(tx: Tx, orderId: string) {
  const claimed = await tx.order.updateMany({ where: { id: orderId, stockRestored: false }, data: { stockRestored: true } });
  if (claimed.count === 0) return;
  const items = await tx.orderItem.findMany({ where: { orderId } });
  for (const it of items) {
    if (it.variantId) {
      await tx.productVariant.updateMany({ where: { id: it.variantId }, data: { stock: { increment: it.quantity } } });
    } else if (it.productId) {
      await tx.product.updateMany({ where: { id: it.productId }, data: { stock: { increment: it.quantity } } });
    }
    if (it.productId) await tx.product.updateMany({ where: { id: it.productId, soldCount: { gte: it.quantity } }, data: { soldCount: { decrement: it.quantity } } });
  }
}

/** Takes stock again if a cancelled order is reopened. */
async function retakeStock(tx: Tx, orderId: string) {
  const claimed = await tx.order.updateMany({ where: { id: orderId, stockRestored: true }, data: { stockRestored: false } });
  if (claimed.count === 0) return;
  const items = await tx.orderItem.findMany({ where: { orderId } });
  for (const it of items) {
    if (!it.productId) continue;
    await takeStock(tx, { productId: it.productId, variantId: it.variantId, qty: it.quantity, title: it.title });
    await tx.product.update({ where: { id: it.productId }, data: { soldCount: { increment: it.quantity } } });
  }
}

export async function changeOrderStatus(
  orderId: string,
  status: string,
  opts: { actor: string; note?: string; courierName?: string | null; trackingNumber?: string | null },
) {
  if (!(ORDER_STATUSES as readonly string[]).includes(status)) throw new Error("Unknown status");
  return db.$transaction(async (tx) => {
    const order = await tx.order.findUniqueOrThrow({ where: { id: orderId } });
    const releasing = status === "CANCELLED" || status === "RETURNED";
    if (releasing) await restoreStock(tx, orderId);
    else if (order.stockRestored) await retakeStock(tx, orderId);

    const data: Prisma.OrderUpdateInput = { status };
    if (opts.courierName !== undefined) data.courierName = opts.courierName || null;
    if (opts.trackingNumber !== undefined) data.trackingNumber = opts.trackingNumber || null;
    if (status === "DELIVERED" && order.paymentMethod === "cod" && order.paymentStatus === "UNPAID") data.paymentStatus = "PAID";
    const updated = await tx.order.update({ where: { id: orderId }, data });
    if (status !== order.status) {
      await tx.orderStatusHistory.create({ data: { orderId, status, note: opts.note ?? "", actor: opts.actor } });
    }
    return { before: order, after: updated };
  });
}

export async function decidePayment(orderId: string, approve: boolean, actor: string, note?: string) {
  return db.$transaction(async (tx) => {
    const order = await tx.order.findUniqueOrThrow({ where: { id: orderId } });
    const updated = await tx.order.update({
      where: { id: orderId },
      data: {
        paymentStatus: approve ? "PAID" : "REJECTED",
        ...(approve && order.status === "NEW" ? { status: "CONFIRMED" } : {}),
      },
    });
    await tx.orderStatusHistory.create({
      data: {
        orderId,
        status: approve && order.status === "NEW" ? "CONFIRMED" : order.status,
        note: approve ? `Payment approved${note ? `: ${note}` : ""}` : `Payment rejected${note ? `: ${note}` : ""}`,
        actor,
      },
    });
    return updated;
  });
}

/** For future card gateways: mark an order as paid from a verified callback. */
export async function markOrderPaid(orderNumber: number, reference?: string) {
  return db.order.update({ where: { number: orderNumber }, data: { paymentStatus: "PAID", paymentReference: reference } });
}

export async function findOrderForTracking(number: number, phone: string) {
  const order = await db.order.findUnique({
    where: { number },
    include: { items: true, history: { orderBy: { createdAt: "asc" } } },
  });
  if (!order) return null;
  const a = normalizePhone(phone);
  const b = order.phoneNormalized;
  // Accept a match on the last 10 digits so "0300..." and "+92 300..." both work.
  if (a.length < 10 || a.slice(-10) !== b.slice(-10)) return null;
  return order;
}
