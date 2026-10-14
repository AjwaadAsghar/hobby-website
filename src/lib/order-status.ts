export const ORDER_FLOW = ["NEW", "CONFIRMED", "PACKED", "SHIPPED", "DELIVERED"] as const;
export const ORDER_STATUSES = [...ORDER_FLOW, "CANCELLED", "RETURNED"] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const ORDER_STATUS_LABEL: Record<string, string> = {
  NEW: "New",
  CONFIRMED: "Confirmed",
  PACKED: "Packed",
  SHIPPED: "Shipped",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
  RETURNED: "Returned",
};

/** What the customer sees on the tracking page. */
export const ORDER_STATUS_CUSTOMER: Record<string, string> = {
  NEW: "We have received your order and will confirm it shortly.",
  CONFIRMED: "Your order is confirmed and being prepared.",
  PACKED: "Your order is packed and waiting for the courier.",
  SHIPPED: "Your order is on its way.",
  DELIVERED: "Your order has been delivered. Enjoy!",
  CANCELLED: "This order was cancelled.",
  RETURNED: "This order was returned.",
};

export const ORDER_STATUS_TONE: Record<string, string> = {
  NEW: "bg-blue-100 text-blue-900 dark:bg-blue-950 dark:text-blue-200",
  CONFIRMED: "bg-indigo-100 text-indigo-900 dark:bg-indigo-950 dark:text-indigo-200",
  PACKED: "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200",
  SHIPPED: "bg-violet-100 text-violet-900 dark:bg-violet-950 dark:text-violet-200",
  DELIVERED: "bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200",
  CANCELLED: "bg-zinc-200 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200",
  RETURNED: "bg-rose-100 text-rose-900 dark:bg-rose-950 dark:text-rose-200",
};

export const PAYMENT_STATUS_LABEL: Record<string, string> = {
  UNPAID: "Pay on delivery",
  AWAITING_PAYMENT: "Awaiting payment",
  AWAITING_VERIFICATION: "Awaiting payment verification",
  PAID: "Paid",
  REJECTED: "Payment rejected",
};

export const PAYMENT_STATUS_TONE: Record<string, string> = {
  UNPAID: "bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100",
  AWAITING_PAYMENT: "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200",
  AWAITING_VERIFICATION: "bg-orange-100 text-orange-900 dark:bg-orange-950 dark:text-orange-200",
  PAID: "bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200",
  REJECTED: "bg-red-100 text-red-900 dark:bg-red-950 dark:text-red-200",
};

/** Pending = needs action from the shop. */
export const PENDING_STATUSES = ["NEW", "CONFIRMED", "PACKED"];
