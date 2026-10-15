/**
 * Default content for the editable pages. Tokens like {{storeName}} are
 * replaced at render time with the current settings, so renaming the store
 * updates these pages automatically.
 *
 * Available tokens: {{storeName}} {{email}} {{phone}} {{whatsapp}} {{address}} {{freeShippingThreshold}}
 */
export const defaultPages: Record<string, { title: string; content: string }> = {
  about: {
    title: "About us",
    content: `<h2>RC hobbyists, serving RC hobbyists</h2>
<p>{{storeName}} started as a small group of friends who spent their weekends racing buggies in empty car parks and flying foam trainers at the local field. We kept getting asked the same question: <strong>"Where can I buy a genuine one in Pakistan?"</strong> So we opened a shop.</p>
<p>Today we stock ready-to-run cars, planes, drones, helicopters and boats, plus the batteries, chargers, radios and spare parts that keep them running. Every product we sell is one we would happily use ourselves.</p>
<h3>What we promise</h3>
<ul>
<li><strong>Genuine products only.</strong> No copies, no grey-market surprises.</li>
<li><strong>Honest advice.</strong> Tell us your budget and skill level and we will recommend the right model, even if it is the cheaper one.</li>
<li><strong>Help after you buy.</strong> Stuck binding a radio or setting up a charger? Message us on WhatsApp and a real person will help.</li>
</ul>
<p>Thank you for supporting a small local hobby shop.</p>`,
  },
  contact: {
    title: "Contact us",
    content: `<p>We are happy to help with orders, product advice and setup questions. The quickest way to reach us is WhatsApp.</p>
<ul>
<li><strong>Phone:</strong> {{phone}}</li>
<li><strong>Email:</strong> {{email}}</li>
<li><strong>Shop address:</strong> {{address}}</li>
<li><strong>Hours:</strong> Monday to Saturday, 11am to 8pm</li>
</ul>`,
  },
  "shipping-policy": {
    title: "Shipping policy",
    content: `<h2>Where we deliver</h2>
<p>{{storeName}} delivers to every city in Pakistan through trusted courier partners (TCS, Leopards, M&amp;P and others).</p>
<h2>How long it takes</h2>
<ul>
<li>Lahore, Karachi, Islamabad and Rawalpindi: usually <strong>1–3 working days</strong>.</li>
<li>Other cities: usually <strong>2–5 working days</strong>.</li>
</ul>
<p>Orders placed before 3pm (Monday to Saturday) are normally packed the same day.</p>
<h2>Shipping cost</h2>
<p>The shipping cost for your city is shown at checkout before you place the order. Orders above {{freeShippingThreshold}} ship free.</p>
<h2>Tracking your order</h2>
<p>Once your parcel is handed to the courier we will email you the tracking number (if you gave an email) and you can always check the status on our <a href="/track">Track my order</a> page using your order number and phone number.</p>
<h2>LiPo batteries</h2>
<p>Lithium batteries are shipped by road only, in fire-safe packaging, as required by courier rules. This can add a day to delivery time.</p>`,
  },
  "returns-policy": {
    title: "Returns policy",
    content: `<h2>7-day returns</h2>
<p>If something is not right, contact us within <strong>7 days</strong> of delivery. Unused items in their original packaging can be returned for an exchange or refund.</p>
<h2>Damaged or faulty items</h2>
<p>Please record a short unboxing video when your parcel arrives. If anything is damaged in transit or faulty out of the box, send us the video and photos on WhatsApp and we will replace it at no cost to you.</p>
<h2>What we cannot accept</h2>
<ul>
<li>Items that have been crashed, flown, driven or modified.</li>
<li>LiPo batteries that have been charged or used (for safety reasons).</li>
<li>Kits that have been partly or fully assembled.</li>
</ul>
<h2>How refunds are paid</h2>
<p>Refunds are sent by bank transfer, JazzCash or Easypaisa within 5 working days of us receiving the returned item.</p>
<p>Questions? Call us on {{phone}} or message us on WhatsApp.</p>`,
  },
  faq: {
    title: "Frequently asked questions",
    content: `<h3>Do you offer cash on delivery?</h3>
<p>Yes. Cash on delivery is available all over Pakistan. You pay the courier when your parcel arrives.</p>
<h3>Are your products genuine?</h3>
<p>Yes. {{storeName}} only sells original products from the brand or its official distributors.</p>
<h3>What does RTR, RTF, BNF and PNP mean?</h3>
<ul>
<li><strong>RTR / RTF (Ready to Run / Fly):</strong> everything is included. Charge the battery and go. Best for beginners.</li>
<li><strong>BNF (Bind and Fly):</strong> you need your own compatible transmitter.</li>
<li><strong>PNP (Plug and Play):</strong> you add your own receiver, battery and transmitter.</li>
<li><strong>Kit:</strong> you build it yourself. Great fun if you enjoy assembly.</li>
</ul>
<h3>Not sure which part fits my model?</h3>
<p>Message us on WhatsApp with your model name and what you need, and we will tell you which parts fit.</p>
<h3>How do I track my order?</h3>
<p>Go to <a href="/track">Track my order</a> and enter your order number and the phone number you used at checkout.</p>
<h3>Do I need an account to order?</h3>
<p>No. You can check out as a guest. An account only saves your address and order history for next time.</p>`,
  },
};

export function fillPageTokens(html: string, values: Record<string, string>): string {
  return html.replace(/\{\{(\w+)\}\}/g, (m, key: string) => (key in values ? values[key] : m));
}
