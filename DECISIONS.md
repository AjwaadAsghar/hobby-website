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
