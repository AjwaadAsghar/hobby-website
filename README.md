# Hobby Shobby — online store

A complete online shop for RC cars, planes and drones: storefront, checkout, order tracking and a full admin panel. It runs on your own computer with no setup, and goes live on Vercel with free database, image and email services.

- **Going live?** Follow [SETUP_CHECKLIST.md](SETUP_CHECKLIST.md) step by step.
- **Why does it work this way?** See [DECISIONS.md](DECISIONS.md).

## Run it on your computer

You need [Node.js 20 or newer](https://nodejs.org).

```bash
npm install
npm run dev
```

Open <http://localhost:3000>. The first run creates `.env.local`, a local database (`prisma/dev.db`) and sample data on its own.

**Admin panel:** <http://localhost:3000/admin>
Sign in with `admin@hobbyshobby.local` / `ChangeMe123!`. You will be asked to choose a new password straight away.

## What's included

**Storefront**
- Homepage with a 3D hero, categories, featured products, new arrivals, best sellers and testimonials
- Shop, category and search pages with filters, sorting and typo-tolerant search
- Product pages with a zoomable gallery, optional 3D model, variants, specs and related products
- Cart, two-step guest checkout, discount codes and shipping by city
- Payment by cash on delivery, bank transfer, JazzCash or Easypaisa (with screenshot upload)
- Order tracking by order number and phone, plus optional customer accounts
- Text size toggle, dark mode, keyboard and screen-reader friendly, WhatsApp help button
- SEO: sitemap, robots.txt, structured data for Google and share images for WhatsApp and Facebook

**Admin**
- Dashboard with sales, charts and low-stock alerts
- Orders: status flow, payment approval, courier tracking, invoices, packing slips and CSV/Excel export
- Products, inventory, categories, discounts, shipping zones, pages and customers
- Reports, settings (branding, contact, payments, homepage) and admin users with roles
- New-order alerts by Telegram, email, phone push notification and an in-dashboard chime

## Commands

| Command | What it does |
|---|---|
| `npm run dev` | Start the store locally (sets everything up first) |
| `npm run check` | Typecheck, lint and production build — run before deploying |
| `npm run db:seed -- --force` | **Wipe** the local database and reload sample data |
| `npm run db:reset` | Recreate the local database from scratch |
| `npm run db:studio` | Browse the database in your browser |
| `npm run vapid` | Generate push notification keys for production |

## Configuration

Store settings such as the name, colours, contact details, payment methods and homepage content are edited in **Admin → Settings**. You don't edit them in code.

Secrets and service keys go in environment variables. Every variable is explained in [.env.example](.env.example). All of them are optional locally:

| Service | Without it |
|---|---|
| PostgreSQL (`DATABASE_URL`) | Uses a local SQLite file |
| Cloudinary | Uploads are saved to `uploads/` |
| Resend | Emails are printed in the terminal and kept in Admin → Integrations → Email log |
| Telegram | Alerts are skipped and logged |
| Web push keys | Generated automatically locally |

## Project layout

```
src/app/(store)     Storefront pages
src/app/admin       Admin panel
src/app/api         Checkout, uploads, search and other endpoints
src/server          Database logic: orders, pricing, notifications, storage
src/config          Default settings and default page text
src/components      UI (store/, admin/, three/ for 3D, ui/ for shared parts)
prisma              Database schema, seed data and placeholder images
scripts             Automatic setup and database provider switching
```

Built with Next.js 16, React 19, Tailwind CSS 4, shadcn/ui, Prisma 6, Auth.js 5 and React Three Fiber.
