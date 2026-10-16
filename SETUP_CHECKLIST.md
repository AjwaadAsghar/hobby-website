# Going live: setup checklist

Work through this list from top to bottom. Each step takes 5–10 minutes and every service here has a free plan. Keep a note open to paste the values you collect.

## 1. Database — Supabase (required)

1. Sign up at <https://supabase.com> and create a project. Choose the region closest to your customers (e.g. Mumbai or Singapore) and a database password made of **letters and numbers only**.
2. Click **Connect** (top bar) → **ORM** → **Prisma**. Copy the two lines it shows and replace `[YOUR-PASSWORD]` in both:
   - **`DATABASE_URL`**: the pooled one (port **6543**). Make it end with `?pgbouncer=true&connection_limit=5`.
   - **`DIRECT_URL`**: the session one (port **5432**). It's only used to create and update tables.

   No ORM tab? Under **Direct → Connection string**, the **Transaction pooler** is `DATABASE_URL` and the **Session pooler** is `DIRECT_URL`. Don't use "Direct connection"; Vercel can't reach it.

The code switches from the local database to PostgreSQL automatically. You don't need to edit anything.

**Region:** `vercel.json` runs the site in Tokyo (`hnd1`) to sit next to a Supabase project in Tokyo. If your Supabase project is in another region, change it to the nearest Vercel region (e.g. `bom1` Mumbai, `sin1` Singapore, `fra1` Frankfurt). A far-away database makes every page slow.

## 2. File uploads — Supabase Storage (required on Vercel)

Vercel deletes files saved to its disk, so product photos and payment screenshots must go to cloud storage. The same Supabase project handles this; no extra account is needed.

1. In Supabase, open **Project Settings → Data API** and copy the **Project URL** (like `https://abcd.supabase.co`). Save it as **`SUPABASE_URL`**.
2. Open **Project Settings → API Keys** and copy the **Secret key** (starts with `sb_secret_`), or the legacy **service_role** key. Save it as **`SUPABASE_SERVICE_ROLE_KEY`**. Keep it secret: it has full access to your project.

The store creates two storage buckets on the first upload: `store` (public: product photos) and `store-private` (payment screenshots, shown to admins only). Cloudinary also works if you prefer it; see `.env.example`.

## 3. Login security (required)

1. Open <https://generate-secret.vercel.app/32> and copy the value.
2. Save it as **`AUTH_SECRET`**. Never share it.

## 4. Push notifications (recommended)

On your computer, run `npm run vapid`. It prints three lines:
**`NEXT_PUBLIC_VAPID_PUBLIC_KEY`**, **`VAPID_PRIVATE_KEY`** and **`VAPID_SUBJECT`**. Put your own email in `VAPID_SUBJECT`, e.g. `mailto:you@yourshop.pk`.

## 5. Email — Resend (recommended)

1. Sign up at <https://resend.com>.
2. Under **Domains**, add your shop's domain and add the DNS records it shows you at your domain provider. Wait until it says *Verified*.
3. Under **API Keys**, create a key. Save it as **`RESEND_API_KEY`**.
4. Save **`EMAIL_FROM`** as an address on that domain, e.g. `Hobby Shobby <orders@yourshop.pk>`.

If you skip this step, emails aren't sent. You can still read them in Admin → Integrations → Email log.

## 6. Telegram order alerts (recommended)

1. In Telegram, message **@BotFather** and send `/newbot`. Follow the prompts. Save the token it gives you as **`TELEGRAM_BOT_TOKEN`**.
2. Open a chat with your new bot and send it any message, e.g. "hi".
3. In a browser, open `https://api.telegram.org/bot<YOUR_TOKEN>/getUpdates`, replacing `<YOUR_TOKEN>` with the token.
4. Find `"chat":{"id":` followed by a number. Save that number as **`TELEGRAM_CHAT_ID`**.
   For alerts in a group: add the bot to the group, send a message there, and use the group's ID (it starts with `-`).

## 7. Deploy on Vercel

1. Push this project to a GitHub repository.
2. Sign up at <https://vercel.com> with GitHub, click **Add New → Project** and import the repository.
3. Under **Environment Variables**, add everything you saved above, plus:
   - **`NEXT_PUBLIC_SITE_URL`**: your store's address, e.g. `https://yourshop.pk`. Use the `.vercel.app` address until your domain is connected.
   - **`SEED_SAMPLE_ORDERS`**: `false`. The first deploy adds sample products and pages but no fake orders, so your reports start at zero.
4. Click **Deploy**. The first deploy creates the database tables and the starter data.

## 8. Your domain

1. In Vercel, open **Project → Settings → Domains** and add your domain.
2. Add the DNS records Vercel shows at your domain provider.
3. Update **`NEXT_PUBLIC_SITE_URL`** to the final address and redeploy (**Deployments → ⋯ → Redeploy**).

## 9. First login and store setup

1. Go to `https://yourshop.pk/admin` and sign in with `admin@hobbyshobby.local` / `ChangeMe123!`.
2. **Choose a strong new password** when asked.
3. In **Admin → Users**, add your own email as an Owner. Sign in with it, then deactivate the default admin.
4. In **Settings**, fill in each tab:
   - **Branding**: store name, logo, favicon and colour.
   - **Contact**: phone, WhatsApp, address and social links.
   - **Payments**: turn on the methods you accept and enter your real bank, JazzCash and Easypaisa account details.
   - **Notifications**: the email address that receives new-order emails.
5. Replace or delete the sample products. Use **Products** (bulk actions) to remove the ones you don't sell.
6. Check **Shipping** zones and rates, **Discounts** (delete the sample codes you don't want) and **Pages** (About, FAQ, policies).
7. Open **Settings → Integrations** and press **Test** next to each service. Each one should show a green check.
8. On your phone, open the admin, add it to your Home Screen, then open it from there, tap the **Alerts** bell and choose **Turn on notifications on this device**. Do the same on every staff phone that should get alerts.

## 10. Final checks

- [ ] Place a real test order from your phone with cash on delivery. Check that you received the Telegram alert, the email and the push notification.
- [ ] Track that order at `/track` using the order number and phone.
- [ ] Cancel the test order in the admin.
- [ ] Share a product link in WhatsApp and check that the preview card shows the product.
- [ ] Add your site in [Google Search Console](https://search.google.com/search-console) and submit `https://yourshop.pk/sitemap.xml`.
