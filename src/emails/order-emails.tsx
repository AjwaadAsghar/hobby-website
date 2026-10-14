import { Column, Row, Section, Text } from "@react-email/components";
import { EmailButton, EmailLayout, heading, text, type EmailBrand } from "./layout";

export type EmailOrder = {
  number: number;
  customerName: string;
  phone: string;
  email: string | null;
  address: string;
  city: string;
  notes: string;
  paymentLabel: string;
  paymentStatusLabel: string;
  items: { title: string; variantName: string | null; quantity: number; lineTotal: string }[];
  subtotal: string;
  discount: string | null;
  shipping: string;
  total: string;
  courierName?: string | null;
  trackingNumber?: string | null;
  trackUrl: string;
  orderUrl: string;
  /** Manual payment instructions to repeat in the email */
  paymentInstructions?: { instructions: string; details: { label: string; value: string }[] } | null;
};

function Items({ order }: { order: EmailOrder }) {
  const row = { fontSize: 15, margin: "4px 0", color: "#18181b" } as const;
  return (
    <Section style={{ border: "1px solid #e4e4e7", borderRadius: 12, padding: "12px 16px", margin: "16px 0" }}>
      {order.items.map((it, i) => (
        <Row key={i}>
          <Column>
            <Text style={row}>
              {it.quantity} × {it.title}
              {it.variantName ? ` (${it.variantName})` : ""}
            </Text>
          </Column>
          <Column align="right">
            <Text style={{ ...row, fontWeight: 700 }}>{it.lineTotal}</Text>
          </Column>
        </Row>
      ))}
      <Row>
        <Column>
          <Text style={{ ...row, color: "#52525b" }}>Subtotal</Text>
        </Column>
        <Column align="right">
          <Text style={row}>{order.subtotal}</Text>
        </Column>
      </Row>
      {order.discount && (
        <Row>
          <Column>
            <Text style={{ ...row, color: "#15803d" }}>Discount</Text>
          </Column>
          <Column align="right">
            <Text style={{ ...row, color: "#15803d" }}>−{order.discount}</Text>
          </Column>
        </Row>
      )}
      <Row>
        <Column>
          <Text style={{ ...row, color: "#52525b" }}>Delivery</Text>
        </Column>
        <Column align="right">
          <Text style={row}>{order.shipping}</Text>
        </Column>
      </Row>
      <Row>
        <Column>
          <Text style={{ ...row, fontSize: 18, fontWeight: 800 }}>Total</Text>
        </Column>
        <Column align="right">
          <Text style={{ ...row, fontSize: 18, fontWeight: 800 }}>{order.total}</Text>
        </Column>
      </Row>
    </Section>
  );
}

function Address({ order }: { order: EmailOrder }) {
  return (
    <Text style={text}>
      <strong>Delivering to:</strong>
      <br />
      {order.customerName}, {order.phone}
      <br />
      {order.address}, {order.city}
    </Text>
  );
}

export function OrderConfirmationEmail({ brand, order }: { brand: EmailBrand; order: EmailOrder }) {
  return (
    <EmailLayout brand={brand} preview={`Order #${order.number} received - thank you!`}>
      <Text style={heading}>Thank you, {order.customerName.split(" ")[0]}!</Text>
      <Text style={text}>
        We have received your order <strong>#{order.number}</strong>. We will call or message you to confirm it shortly.
      </Text>
      <Text style={text}>
        <strong>Payment:</strong> {order.paymentLabel} ({order.paymentStatusLabel})
      </Text>
      {order.paymentInstructions && (
        <Section style={{ backgroundColor: "#fef3c7", borderRadius: 12, padding: "12px 16px", margin: "0 0 14px" }}>
          <Text style={{ ...text, margin: "0 0 8px" }}>{order.paymentInstructions.instructions}</Text>
          {order.paymentInstructions.details.map((d) => (
            <Text key={d.label} style={{ ...text, margin: "0 0 4px" }}>
              <strong>{d.label}:</strong> {d.value}
            </Text>
          ))}
          <Text style={{ ...text, margin: "8px 0 0" }}>Please use your order number #{order.number} as the payment reference.</Text>
        </Section>
      )}
      <Items order={order} />
      <Address order={order} />
      <EmailButton href={order.trackUrl} label="Track my order" brand={brand} />
    </EmailLayout>
  );
}

const statusCopy: Record<string, { title: string; body: string }> = {
  CONFIRMED: { title: "Your order is confirmed", body: "Good news - we have confirmed your order and are getting it ready." },
  PACKED: { title: "Your order is packed", body: "Your order is packed and will be handed to the courier soon." },
  SHIPPED: { title: "Your order is on its way", body: "Your parcel has been handed to the courier." },
  DELIVERED: { title: "Your order has been delivered", body: "We hope you enjoy it! If anything is not right, just reply to this email." },
  CANCELLED: { title: "Your order was cancelled", body: "Your order has been cancelled. If you did not expect this, please contact us." },
  RETURNED: { title: "Your return is complete", body: "We have received your returned order. We will be in touch about your refund or exchange." },
  PAYMENT_APPROVED: { title: "Payment received", body: "Thank you - we have checked and approved your payment. Your order is now being prepared." },
  PAYMENT_REJECTED: {
    title: "We could not confirm your payment",
    body: "We could not match your payment screenshot to a payment. Please contact us so we can sort it out, or upload a new screenshot from the tracking page.",
  },
};

export function OrderStatusEmail({ brand, order, event }: { brand: EmailBrand; order: EmailOrder; event: string }) {
  const copy = statusCopy[event] ?? { title: "Order update", body: "There is an update on your order." };
  return (
    <EmailLayout brand={brand} preview={`Order #${order.number}: ${copy.title}`}>
      <Text style={heading}>{copy.title}</Text>
      <Text style={text}>
        Hi {order.customerName.split(" ")[0]}, {copy.body.charAt(0).toLowerCase() + copy.body.slice(1)}
      </Text>
      <Text style={text}>
        Order number: <strong>#{order.number}</strong>
      </Text>
      {event === "SHIPPED" && (order.courierName || order.trackingNumber) && (
        <Section style={{ backgroundColor: "#f4f4f5", borderRadius: 12, padding: "12px 16px", margin: "0 0 14px" }}>
          {order.courierName && (
            <Text style={{ ...text, margin: "0 0 4px" }}>
              <strong>Courier:</strong> {order.courierName}
            </Text>
          )}
          {order.trackingNumber && (
            <Text style={{ ...text, margin: 0 }}>
              <strong>Tracking number:</strong> {order.trackingNumber}
            </Text>
          )}
        </Section>
      )}
      <Items order={order} />
      <EmailButton href={order.trackUrl} label="See order status" brand={brand} />
    </EmailLayout>
  );
}

export function OwnerNewOrderEmail({ brand, order, title }: { brand: EmailBrand; order: EmailOrder; title?: string }) {
  return (
    <EmailLayout brand={brand} preview={`${title ?? "New order"} #${order.number} - ${order.total}`}>
      <Text style={heading}>
        {title ?? "New order"} #{order.number}
      </Text>
      <Text style={text}>
        <strong>{order.customerName}</strong> from {order.city} · {order.phone}
        {order.email ? ` · ${order.email}` : ""}
      </Text>
      <Text style={text}>
        <strong>Payment:</strong> {order.paymentLabel} - {order.paymentStatusLabel}
      </Text>
      <Items order={order} />
      <Address order={order} />
      {order.notes && (
        <Text style={text}>
          <strong>Customer notes:</strong> {order.notes}
        </Text>
      )}
      <EmailButton href={order.orderUrl} label="Open in admin" brand={brand} />
    </EmailLayout>
  );
}

export function SimpleEmail({ brand, title, body }: { brand: EmailBrand; title: string; body: string }) {
  return (
    <EmailLayout brand={brand} preview={title}>
      <Text style={heading}>{title}</Text>
      {body.split("\n").map((line, i) => (
        <Text key={i} style={text}>
          {line}
        </Text>
      ))}
    </EmailLayout>
  );
}
