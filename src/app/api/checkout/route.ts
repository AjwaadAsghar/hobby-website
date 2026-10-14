import { NextResponse, after } from "next/server";
import { auth } from "@/auth";
import { checkoutSchema, fieldErrors } from "@/lib/validation/checkout";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { CheckoutError, createOrder } from "@/server/orders";
import { notifyLowStock, notifyNewOrder } from "@/server/notify";
import { getSettings, siteUrl } from "@/lib/settings";

export async function POST(req: Request) {
  const ip = clientIp(req.headers);
  const limit = rateLimit(`checkout:${ip}`, 8, 10 * 60_000);
  if (!limit.ok) {
    return NextResponse.json(
      { error: `Too many orders from this connection. Please wait ${Math.ceil(limit.retryAfter / 60)} minute(s) or contact us on WhatsApp.` },
      { status: 429 },
    );
  }

  const parsed = checkoutSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Please check the highlighted fields.", fieldErrors: fieldErrors(parsed.error) }, { status: 400 });
  }

  const session = await auth();
  const userId = session?.user?.role === "CUSTOMER" ? session.user.id : null;

  try {
    const { order, lowStock, provider } = await createOrder(parsed.data, userId);

    // Notifications run after the response is sent, so the customer never waits for them.
    after(async () => {
      await notifyNewOrder(order.id);
      await notifyLowStock(lowStock);
    });

    let redirectUrl: string | null = null;
    if (provider.initiate) {
      const s = await getSettings();
      const base = siteUrl();
      const confirmation = `${base}/order/confirmation?n=${order.number}&t=${order.accessToken}`;
      const res = await provider.initiate(
        {
          id: order.id,
          number: order.number,
          total: order.total,
          currency: s.commerce.currency,
          customerName: order.customerName,
          phone: order.phone,
          email: order.email,
          accessToken: order.accessToken,
        },
        { returnUrl: confirmation, cancelUrl: confirmation },
      );
      redirectUrl = res.redirectUrl;
    }

    return NextResponse.json({ ok: true, number: order.number, token: order.accessToken, redirectUrl });
  } catch (err) {
    if (err instanceof CheckoutError) {
      return NextResponse.json({ error: err.message, problems: err.problems }, { status: 409 });
    }
    console.error("[checkout] failed", err);
    return NextResponse.json({ error: "Sorry, we could not place your order. Please try again, or order on WhatsApp." }, { status: 500 });
  }
}
