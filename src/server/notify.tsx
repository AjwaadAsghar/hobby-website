import "server-only";
import { db } from "@/lib/db";
import { getSettings, siteUrl } from "@/lib/settings";
import { formatMoney } from "@/lib/money";
import { getPaymentProvider, paymentLabel } from "@/lib/payments/registry";
import { ORDER_STATUS_LABEL, PAYMENT_STATUS_LABEL } from "@/lib/order-status";
import { sendEmail, getEmailBrand } from "@/server/email/send";
import { sendTelegram, tgEscape } from "@/server/telegram";
import { sendPushToAdmins } from "@/server/push";
import { OrderConfirmationEmail, OrderStatusEmail, OwnerNewOrderEmail, type EmailOrder } from "@/emails/order-emails";

/**
 * Every notification channel is independent and fail-safe: one failing (or
 * not being configured) never stops the others or the order itself. Failures
 * are recorded in IntegrationLog and shown on Admin → Settings → Integrations.
 */
async function safely(label: string, fn: () => Promise<unknown>) {
  try {
    await fn();
  } catch (err) {
    console.error(`[notify] ${label} failed:`, err);
  }
}

async function loadOrder(orderId: string) {
  return db.order.findUnique({ where: { id: orderId }, include: { items: true } });
}
type FullOrder = NonNullable<Awaited<ReturnType<typeof loadOrder>>>;

async function toEmailOrder(order: FullOrder): Promise<EmailOrder> {
  const s = await getSettings();
  const fmt = { currency: s.commerce.currency, locale: s.commerce.locale };
  const m = (n: number) => formatMoney(n, fmt);
  const provider = getPaymentProvider(order.paymentMethod);
  const info = provider?.publicInfo(s);
  return {
    number: order.number,
    customerName: order.customerName,
    phone: order.phone,
    email: order.email,
    address: order.address,
    city: order.city,
    notes: order.notes,
    paymentLabel: paymentLabel(order.paymentMethod),
    paymentStatusLabel: PAYMENT_STATUS_LABEL[order.paymentStatus] ?? order.paymentStatus,
    items: order.items.map((i) => ({ title: i.title, variantName: i.variantName, quantity: i.quantity, lineTotal: m(i.lineTotal) })),
    subtotal: m(order.subtotal),
    discount: order.discountTotal > 0 ? m(order.discountTotal) : null,
    shipping: order.shippingTotal > 0 ? m(order.shippingTotal) : "Free",
    total: m(order.total),
    courierName: order.courierName,
    trackingNumber: order.trackingNumber,
    trackUrl: `${siteUrl()}/track?order=${order.number}`,
    orderUrl: `${siteUrl()}/admin/orders/${order.id}`,
    paymentInstructions:
      info && info.kind === "manual_proof" && order.paymentStatus !== "PAID" ? { instructions: info.instructions, details: info.details } : null,
  };
}

function telegramOrder(order: FullOrder, money: (n: number) => string, heading: string) {
  const items = order.items.map((i) => `• ${i.quantity} × ${tgEscape(i.title)}${i.variantName ? ` (${tgEscape(i.variantName)})` : ""}`).join("\n");
  return [
    `<b>${heading} #${order.number}</b>`,
    `👤 ${tgEscape(order.customerName)} · ${tgEscape(order.city)}`,
    `📞 ${tgEscape(order.phone)}`,
    "",
    items,
    "",
    `💰 <b>Total: ${money(order.total)}</b> (${paymentLabel(order.paymentMethod)})`,
    `<a href="${siteUrl()}/admin/orders/${order.id}">Open order in admin</a>`,
  ].join("\n");
}

export async function notifyNewOrder(orderId: string) {
  const [order, s] = await Promise.all([loadOrder(orderId), getSettings()]);
  if (!order) return;
  const money = (n: number) => formatMoney(n, { currency: s.commerce.currency, locale: s.commerce.locale });
  const n = s.notifications.newOrder;
  const emailOrder = await toEmailOrder(order);
  const brand = await getEmailBrand();

  await Promise.all([
    safely("in-app", () =>
      db.adminNotification.create({
        data: {
          type: "NEW_ORDER",
          title: `New order #${order.number}`,
          body: `${order.customerName} (${order.city}) · ${money(order.total)}`,
          link: `/admin/orders/${order.id}`,
        },
      }),
    ),
    n.telegram && safely("telegram", () => sendTelegram(`🛒 ${telegramOrder(order, money, `New order for ${tgEscape(s.branding.storeName)}`)}`)),
    n.email &&
      s.notifications.ownerEmail &&
      safely("owner email", () =>
        sendEmail({
          to: s.notifications.ownerEmail,
          subject: `New order #${order.number} - ${money(order.total)} (${order.city})`,
          react: <OwnerNewOrderEmail brand={brand} order={emailOrder} />,
          replyTo: order.email ?? undefined,
        }),
      ),
    n.push &&
      safely("push", () =>
        sendPushToAdmins({
          title: `New order #${order.number}`,
          body: `${order.customerName} · ${order.city} · ${money(order.total)}`,
          url: `/admin/orders/${order.id}`,
          tag: `order-${order.number}`,
        }),
      ),
    s.notifications.customerEmails.confirmation &&
      order.email &&
      safely("customer confirmation", () =>
        sendEmail({
          to: order.email!,
          subject: `Order #${order.number} received - ${s.branding.storeName}`,
          react: <OrderConfirmationEmail brand={brand} order={emailOrder} />,
        }),
      ),
  ]);
}

export async function notifyPaymentProof(orderId: string) {
  const [order, s] = await Promise.all([loadOrder(orderId), getSettings()]);
  if (!order) return;
  const money = (n: number) => formatMoney(n, { currency: s.commerce.currency, locale: s.commerce.locale });
  const n = s.notifications.paymentProof;
  const brand = await getEmailBrand();
  const title = `Payment screenshot for #${order.number}`;
  await Promise.all([
    safely("in-app", () =>
      db.adminNotification.create({
        data: { type: "PAYMENT_PROOF", title, body: `${order.customerName} · ${paymentLabel(order.paymentMethod)} · ${money(order.total)}. Please check and approve.`, link: `/admin/orders/${order.id}` },
      }),
    ),
    n.telegram &&
      safely("telegram", () =>
        sendTelegram(
          `🧾 <b>${title}</b>\n${tgEscape(order.customerName)} paid ${money(order.total)} by ${paymentLabel(order.paymentMethod)}.\nPlease verify the screenshot.\n<a href="${siteUrl()}/admin/orders/${order.id}">Review payment</a>`,
        ),
      ),
    n.email &&
      s.notifications.ownerEmail &&
      safely("owner email", async () =>
        sendEmail({ to: s.notifications.ownerEmail, subject: `${title} - please verify`, react: <OwnerNewOrderEmail brand={brand} order={await toEmailOrder(order)} title="Payment screenshot uploaded for order" /> }),
      ),
    n.push && safely("push", () => sendPushToAdmins({ title, body: `${order.customerName} · ${money(order.total)} - tap to review`, url: `/admin/orders/${order.id}` })),
  ]);
}

/** Alerts once when an item crosses its low-stock threshold. */
export async function notifyLowStock(items: { title: string; stock: number; threshold: number; productId: string }[]) {
  if (!items.length) return;
  const s = await getSettings();
  const n = s.notifications.lowStock;
  const brand = await getEmailBrand();
  const list = items.map((i) => `${i.title}: ${i.stock === 0 ? "OUT OF STOCK" : `${i.stock} left`}`);
  await Promise.all([
    safely("in-app", () =>
      db.adminNotification.createMany({
        data: items.map((i) => ({
          type: "LOW_STOCK",
          title: i.stock === 0 ? `Out of stock: ${i.title}` : `Low stock: ${i.title}`,
          body: i.stock === 0 ? "This item is now sold out." : `Only ${i.stock} left (alert at ${i.threshold}).`,
          link: `/admin/inventory?q=${encodeURIComponent(i.title)}`,
        })),
      }),
    ),
    n.telegram && safely("telegram", () => sendTelegram(`⚠️ <b>Low stock</b>\n${list.map((l) => `• ${tgEscape(l)}`).join("\n")}\n<a href="${siteUrl()}/admin/inventory">Open inventory</a>`)),
    n.email &&
      s.notifications.ownerEmail &&
      safely("owner email", async () => {
        const { SimpleEmail } = await import("@/emails/order-emails");
        return sendEmail({ to: s.notifications.ownerEmail, subject: `Low stock alert (${items.length} item${items.length > 1 ? "s" : ""})`, react: <SimpleEmail brand={brand} title="Low stock alert" body={list.join("\n")} /> });
      }),
    n.push && safely("push", () => sendPushToAdmins({ title: "Low stock alert", body: list.join(", ").slice(0, 180), url: "/admin/inventory" })),
  ]);
}

/** Customer emails for status changes and payment decisions. */
export async function notifyCustomerStatus(orderId: string, event: string) {
  const [order, s] = await Promise.all([loadOrder(orderId), getSettings()]);
  if (!order?.email || !s.notifications.customerEmails.statusUpdates) return;
  const brand = await getEmailBrand();
  const subjects: Record<string, string> = {
    PAYMENT_APPROVED: "Payment received",
    PAYMENT_REJECTED: "Problem with your payment",
    SHIPPED: "Your order is on its way",
    DELIVERED: "Your order has been delivered",
  };
  const subject = `Order #${order.number}: ${subjects[event] ?? ORDER_STATUS_LABEL[event] ?? "Update"}`;
  await safely("status email", async () =>
    sendEmail({ to: order.email!, subject, react: <OrderStatusEmail brand={brand} order={await toEmailOrder(order)} event={event} /> }),
  );
}
