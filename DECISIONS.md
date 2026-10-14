# Decisions log

Choices made while building the store without being able to ask. Each one is easy to change later.

## Platform & tooling

| # | Decision | Why |
|---|----------|-----|
| 1 | **Next.js 16.4 (App Router) with `cacheComponents` turned off.** Every page reads from the database when it is requested. | The spec says admin changes (store name, prices, stock) must show up instantly. Request-time rendering guarantees that with the least complexity. Database reads are small and fast. |
| 2 | **Prisma 6.19** rather than Prisma 7/8. | Prisma 7+ requires native "driver adapters" for SQLite, which often fail to install on Windows. Prisma 6 runs SQLite with zero setup and supports PostgreSQL by changing one line. |
| 3 | **The database provider switches automatically.** `scripts/prepare-db.ts` sets `provider` in `prisma/schema.prisma` to `sqlite` or `postgresql` based on `DATABASE_URL`. | You never edit the schema to go live. The schema avoids anything database-specific: no enums, JSON stored as text. |
| 4 | **`prisma db push` instead of migration files.** | Migration files are tied to one database type. `db push` works for SQLite locally and Postgres in production. Switch to `prisma migrate` once the schema settles. |
| 5 | **Auth.js v5 (`next-auth@beta`) with email + password and JWT sessions.** | v5 is the Auth.js version built for the App Router. JWT sessions need no extra database tables. Admin checks still re-read the user from the database on every request, so a deactivated user is locked out immediately. |
| 6 | **`npm run dev` sets itself up** (`scripts/setup.ts`). It creates `.env.local` with a random `AUTH_SECRET` and VAPID keys, creates the SQLite database and seeds it if empty. | It's a zero-step start for a non-technical owner. |
| 7 | **shadcn/ui "radix-nova" preset** on Tailwind CSS v4. | It is the current shadcn default with Radix primitives, which are fully keyboard-accessible. |

## Data & money

| # | Decision | Why |
|---|----------|-----|
| 8 | **All money is stored as whole numbers in minor units** (paisa). Rs 4,500 is stored as `450000`. | This avoids rounding errors. The admin forms take normal rupee amounts. |
| 9 | **Order numbers are sequential numbers starting at 10001**, with no store-name prefix. | They are easy to read over the phone and type into "Track my order". They also don't hardcode the store name. |
| 10 | **Settings are stored as one JSON row per group** (`branding`, `contact`, `commerce`, `payments`, `notifications`, `homepage`) and merged over the defaults in `src/config/store.ts`. | New settings added in code appear automatically with their default values. |
| 11 | **Page content uses tokens** like `{{storeName}}` and `{{phone}}`, filled in when the page is shown. | Renaming the store updates the About, FAQ and policy pages too. |
| 12 | **Products with variants keep stock on each variant.** Products without variants use the product's own stock. | This matches how Shopify does it. |
| 13 | **Placeholder product images are generated SVGs** (`prisma/placeholders.ts`). | They work offline with no copyright problems. Uploading real photos in admin replaces them. |

## Checkout, orders & payments

| # | Decision | Why |
|---|----------|-----|
| 14 | **Checkout is two steps on one page** (Details, then Payment) with the 4-step indicator. The cart page is step 1 and the confirmation page is step 4. | It needs the fewest page loads and the fewest fields: name, phone, address and city are required; email and notes are optional. |
| 15 | **If anything changed in the cart, the order is refused rather than silently adjusted.** That includes price, stock or discount validity. The customer is asked to review the cart. | No surprises on the bill. |
| 16 | **Payment statuses:** `UNPAID` (cash on delivery), `AWAITING_PAYMENT` (bank/wallet chosen, no screenshot yet), `AWAITING_VERIFICATION` (screenshot uploaded), `PAID`, `REJECTED`. Cash on delivery becomes `PAID` automatically when the order is marked Delivered. | This matches how the shop actually gets paid. |
| 17 | **Approving a payment on a "New" order also moves it to "Confirmed".** | This saves the owner a click. |
| 18 | **Guest order links use a random secret token** in the URL. The tracking page needs the order number plus the phone number, and accepts any phone format: 0300…, +92 300…, 92300… | Strangers can't look up other people's orders. |
| 19 | **Local uploads are stored in `/uploads`** (outside `public/`) and served by `/media/...`. Payment screenshots can only be opened by admins. On Cloudinary, screenshots use unguessable URLs. | `next start` doesn't serve files added to `public/` after the build. |
| 20 | **Order history in customer accounts only shows orders placed while signed in.** It never matches by email. | Email addresses aren't verified, so matching by email would leak orders. |
| 21 | **Notifications are sent after the response** (`after()` from `next/server`). | Checkout stays fast even if Telegram or email is slow or down. |
| 22 | **Rate limits:** checkout 8 per 10 minutes per IP; login 20 per 15 minutes per IP and 8 per email; contact form 5 per 15 minutes; tracking 20 per 10 minutes. These are in-memory (see `src/lib/rate-limit.ts`). | It's simple and needs no extra service. Swap in Upstash Redis if strict global limits are needed. |
| 23 | **Turbopack's on-disk cache is turned off** in `next.config.ts`. | The development machine ran out of disk space during the build. Set both flags to `true` for faster restarts if you have the room. |

## Notifications & admin

| # | Decision | Why |
|---|----------|-----|
| 24 | **In-dashboard alerts poll every 12 seconds** (paused while the tab is hidden) instead of using WebSockets or Server-Sent Events. | Vercel's free tier doesn't keep long connections open. Polling is reliable everywhere and cheap at this scale. |
| 25 | **The new-order sound is generated with the Web Audio API.** | No sound file is needed. Browsers only allow sound after the admin has clicked once on the page; there's a Sound on/off toggle in the bell menu. |
| 26 | **Web push uses a service worker at `/admin-sw.js` scoped to `/admin/`**, plus a manifest at `/admin/manifest.webmanifest`. That makes the admin installable as an app. iPhones need the admin added to the Home Screen before push works (iOS 16.4+). | That's the PWA approach the spec asks for, and iOS only supports web push for Home Screen apps. |
| 27 | **Low-stock alerts fire once, when stock crosses the threshold.** They don't fire on every order afterwards. | This avoids alert spam. |
| 28 | **Customers get an email on every status change** except "New". They also get one when a payment is approved or rejected. Status emails can be switched off in Settings → Notifications. | The spec says status changes email the customer automatically. |
| 29 | **Invoices and packing slips are print-friendly web pages** (browser Print, then Save as PDF), not generated PDF files. | There's no heavy PDF library, the branding always matches current settings, and it works on any printer. |
| 30 | **The admin uses the same 18px base text size and accessible components as the store.** | It's comfortable for older staff too. |
| 31 | **Two admin roles.** Owner can do everything. Staff can manage orders, products, inventory, customers, discounts, shipping, categories and pages, but can't change Settings, Integrations or Admin users. | It's a common, safe split for shop staff. |
| 32 | **"Customers" groups guest orders by phone number**, since most customers check out without an account. Registered accounts, contact messages and newsletter subscribers have their own tabs. | Phone is the one detail every order has. |
| 33 | **Newsletter sign-ups are stored and listed for copy and paste** into Mailchimp or Brevo. No email marketing tool is built in. | Sending marketing email needs a dedicated service and consent handling. |
| 34 | **Shipping zones are matched by exact city name** (case-insensitive). Exactly one zone is the default for all other cities. The checkout city box suggests the known city names. | It's simple to manage and predictable for customers. |

## SEO, accessibility & launch

| # | Decision | Why |
|---|----------|-----|
| 35 | **Share images are generated on the fly** (`opengraph-image.tsx`, `src/lib/og.tsx`): one for the store, one per product with title, price and savings. | Links shared on WhatsApp and Facebook show a branded card that always matches current prices and settings, with no image editing. |
| 36 | **Sitemap and robots.txt are built from the database.** Admin, account, cart, checkout, order, search and payment-proof URLs are excluded, and those pages are also marked `noindex`. | New products appear in Google without any manual step, and private pages stay out of search results. |
| 37 | **The homepage publishes `OnlineStore` and `WebSite` structured data**, including a search action. Products publish `Product` data. | Google can show the store name, logo and a search box in results. |
| 38 | **Brand-coloured text uses a separate `--brand-text` colour**, automatically darkened (or lightened in dark mode) until it reaches 4.5:1 contrast. Buttons and badges keep the exact brand colour. | Any accent colour the owner picks stays readable (WCAG AA). |
| 39 | **The homepage hero is text only, with a pure-CSS animation of two planes** that play once on load and are skipped for reduced motion. It replaced the 3D drone (and its GLB upload setting). Page transitions are pure CSS too. | The message (competitive prices) is what sells; CSS animation costs nothing on the first paint and needs no WebGL, so it is smooth on budget phones. 3D stays available on product pages. |
| 40 | **The header is sticky only on large screens.** | On phones a sticky two-row header covers too much of the screen, especially with large text turned on. |
| 41 | **`SEED_SAMPLE_ORDERS="false"` skips the 84 sample orders** when the first deploy seeds an empty database. Sample products and pages are still added. | Reports on a live store start at zero, while the owner still has example products to edit. |
| 42 | **Each admin turns on push from the bell menu**, as well as from Integrations. | Staff can't open Integrations (owner only), but they still need alerts on their own phones. |
