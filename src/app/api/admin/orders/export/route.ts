import ExcelJS from "exceljs";
import { db } from "@/lib/db";
import { AuthError, requireAdmin } from "@/lib/auth-helpers";
import { buildOrderWhere, parseOrderFilters } from "@/server/admin-orders";
import { toCsv } from "@/lib/csv";
import { paymentLabel } from "@/lib/payments/registry";
import { ORDER_STATUS_LABEL, PAYMENT_STATUS_LABEL } from "@/lib/order-status";

export async function GET(req: Request) {
  try {
    await requireAdmin();
  } catch (e) {
    if (e instanceof AuthError) return new Response(e.message, { status: e.status });
    throw e;
  }
  const url = new URL(req.url);
  const sp = Object.fromEntries(url.searchParams.entries());
  const format = sp.format === "xlsx" ? "xlsx" : "csv";
  const orders = await db.order.findMany({
    where: buildOrderWhere(parseOrderFilters(sp)),
    orderBy: { createdAt: "desc" },
    include: { items: true },
    take: 20000,
  });

  const header = [
    "Order number", "Date", "Status", "Payment method", "Payment status", "Customer", "Phone", "Email", "Address", "City",
    "Items", "Subtotal", "Discount", "Discount code", "Shipping", "Total", "Courier", "Tracking number", "Customer notes",
  ];
  const rows = orders.map((o) => [
    o.number,
    o.createdAt.toISOString().replace("T", " ").slice(0, 16),
    ORDER_STATUS_LABEL[o.status] ?? o.status,
    paymentLabel(o.paymentMethod),
    PAYMENT_STATUS_LABEL[o.paymentStatus] ?? o.paymentStatus,
    o.customerName,
    o.phone,
    o.email ?? "",
    o.address,
    o.city,
    o.items.map((i) => `${i.quantity} x ${i.title}${i.variantName ? ` (${i.variantName})` : ""}`).join("; "),
    o.subtotal / 100,
    o.discountTotal / 100,
    o.discountCode ?? "",
    o.shippingTotal / 100,
    o.total / 100,
    o.courierName ?? "",
    o.trackingNumber ?? "",
    o.notes,
  ]);
  const stamp = new Date().toISOString().slice(0, 10);

  if (format === "csv") {
    return new Response(toCsv([header, ...rows]), {
      headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="orders-${stamp}.csv"` },
    });
  }

  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("Orders");
  ws.addRow(header).font = { bold: true };
  for (const r of rows) ws.addRow(r.map((c) => (typeof c === "string" && /^[=+\-@]/.test(c) ? `'${c}` : c)));
  ws.columns.forEach((c, i) => (c.width = [10, 17, 12, 16, 22, 22, 15, 26, 40, 14, 50, 12, 10, 14, 10, 12, 12, 18, 30][i] ?? 14));
  ws.views = [{ state: "frozen", ySplit: 1 }];
  const buf = await wb.xlsx.writeBuffer();
  return new Response(new Uint8Array(buf as ArrayBuffer), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="orders-${stamp}.xlsx"`,
    },
  });
}
