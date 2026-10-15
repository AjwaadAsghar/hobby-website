/**
 * Sample data: parts categories and products (prisma/catalog-data.ts), shipping zones, discount codes,
 * pages, settings, ~80 orders spread over the last 90 days and the default admin.
 *
 *   npm run db:seed          -> only seeds an empty database
 *   npm run db:seed -- --force  -> wipes store data and re-seeds
 */
import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";
import { storeDefaults } from "../src/config/store";
import { defaultPages } from "../src/config/default-pages";
import { comingSoonSvg, writePlaceholder } from "./placeholders";
import { categoryArtSvg, type CategoryArt } from "./category-art";
import { categories, products } from "./catalog-data";

const db = new PrismaClient();
const force = process.argv.includes("--force");

// Deterministic random so every fresh install looks the same.
let seed = 42;
function rand() {
  seed = (seed * 1664525 + 1013904223) % 4294967296;
  return seed / 4294967296;
}
const pick = <T,>(arr: T[]) => arr[Math.floor(rand() * arr.length)];
const rs = (major: number) => Math.round(major * 100);

const firstNames = ["Ahmed", "Ali", "Usman", "Bilal", "Hamza", "Zain", "Fatima", "Ayesha", "Sana", "Imran", "Tariq", "Hassan", "Omar", "Saad", "Hira", "Nadia", "Kamran", "Faisal", "Asad", "Mariam", "Rehan", "Danish", "Shoaib", "Javed"];
const lastNames = ["Khan", "Malik", "Qureshi", "Sheikh", "Butt", "Chaudhry", "Raza", "Hussain", "Iqbal", "Siddiqui", "Mirza", "Abbasi", "Awan", "Javed"];
const cities = ["Lahore", "Lahore", "Lahore", "Karachi", "Karachi", "Karachi", "Islamabad", "Rawalpindi", "Faisalabad", "Multan", "Peshawar", "Sialkot", "Gujranwala", "Hyderabad", "Quetta"];
const streets = ["House 12, Street 4, DHA Phase 5", "Flat 3B, Block 7, Gulshan-e-Iqbal", "House 45-C, Model Town", "Plot 9, Sector F-7/2", "House 221, Satellite Town", "House 88, Johar Town", "Street 15, G-11/3", "House 7, Cantt Area"];

async function wipe() {
  await db.orderStatusHistory.deleteMany();
  await db.orderItem.deleteMany();
  await db.order.deleteMany();
  await db.productImage.deleteMany();
  await db.productVariant.deleteMany();
  await db.product.deleteMany();
  await db.category.deleteMany();
  await db.discountCode.deleteMany();
  await db.shippingZone.deleteMany();
  await db.page.deleteMany();
  await db.setting.deleteMany();
  await db.adminNotification.deleteMany();
  await db.address.deleteMany();
  await db.pushSubscription.deleteMany();
  await db.user.deleteMany();
}

async function main() {
  const existing = await db.user.count();
  if (existing > 0 && !force) {
    console.log("Database already has data. Use `npm run db:seed -- --force` to wipe and re-seed.");
    return;
  }
  if (force) await wipe();

  // Settings
  for (const [key, value] of Object.entries(storeDefaults)) {
    await db.setting.upsert({ where: { key }, create: { key, value: JSON.stringify(value) }, update: { value: JSON.stringify(value) } });
  }

  // Admin
  await db.user.create({
    data: {
      email: "admin@hobbyshobby.local",
      name: "Store Owner",
      role: "OWNER",
      passwordHash: await bcrypt.hash("ChangeMe123!", 10),
      mustChangePassword: true,
    },
  });

  // Categories
  const catIds: Record<string, string> = {};
  for (const [i, c] of categories.entries()) {
    const image = writePlaceholder(`category-${c.slug}.svg`, categoryArtSvg(c.shape as CategoryArt));
    const cat = await db.category.create({ data: { name: c.name, slug: c.slug, description: c.description, sortOrder: i, image } });
    catIds[c.slug] = cat.id;
  }

  // Products
  const productIds: Record<string, { id: string; price: number; cost: number; title: string; image: string; variants: { id: string; name: string; price: number | null }[] }> = {};
  for (const p of products) {
    const slug = p.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 80);
    const images = [0, 1, 2].map((angle) =>
      writePlaceholder(`${slug}-${angle + 1}.svg`, comingSoonSvg({ title: p.title, shape: p.shape, angle, brand: p.brand })),
    );
    const created = await db.product.create({
      data: {
        title: p.title,
        slug,
        shortDescription: p.short,
        description: p.description,
        price: rs(p.price),
        compareAtPrice: p.compareAt ? rs(p.compareAt) : null,
        costPrice: rs(p.cost),
        sku: `SKU-${slug.split("-").slice(0, 2).join("").toUpperCase().slice(0, 8)}-${Math.floor(rand() * 9000 + 1000)}`,
        brand: p.brand,
        categoryId: catIds[p.category],
        skillLevel: p.skill,
        specs: JSON.stringify(p.specs),
        inTheBox: JSON.stringify(p.inTheBox),
        tags: p.tags.join(", "),
        status: "PUBLISHED",
        featured: !!p.featured,
        stock: p.variants ? 0 : p.stock,
        lowStockThreshold: 3,
        createdAt: new Date(Date.now() - (p.daysAgo ?? 30) * 86400000),
        images: { create: images.map((url, i) => ({ url, alt: `${p.title} - view ${i + 1}`, sortOrder: i })) },
        variants: p.variants
          ? {
              create: p.variants.map((v, i) => ({
                name: v.name,
                options: JSON.stringify(v.options),
                price: v.price ? rs(v.price) : null,
                stock: v.stock,
                sortOrder: i,
                sku: `V-${slug.slice(0, 10).toUpperCase()}-${i + 1}`,
              })),
            }
          : undefined,
      },
      include: { variants: true },
    });
    productIds[p.title] = {
      id: created.id,
      price: created.price,
      cost: created.costPrice ?? 0,
      title: created.title,
      image: images[0],
      variants: created.variants.map((v) => ({ id: v.id, name: v.name, price: v.price })),
    };
  }

  // Compatible parts
  for (const p of products) {
    if (!p.compatibleWith?.length) continue;
    await db.product.update({
      where: { id: productIds[p.title].id },
      data: { compatibleWith: { connect: p.compatibleWith.filter((t) => productIds[t]).map((t) => ({ id: productIds[t].id })) } },
    });
  }

  // Shipping zones
  await db.shippingZone.createMany({
    data: [
      { name: "Lahore", cities: JSON.stringify(["Lahore"]), rate: rs(200), sortOrder: 0 },
      { name: "Karachi", cities: JSON.stringify(["Karachi"]), rate: rs(300), sortOrder: 1 },
      { name: "Islamabad & Rawalpindi", cities: JSON.stringify(["Islamabad", "Rawalpindi"]), rate: rs(300), sortOrder: 2 },
      { name: "Rest of Pakistan", cities: "[]", rate: rs(450), isDefault: true, sortOrder: 3 },
    ],
  });

  // Discount codes
  await db.discountCode.createMany({
    data: [
      { code: "WELCOME10", type: "PERCENT", value: 10, minOrder: rs(5000), usageLimit: 500 },
      { code: "FLY500", type: "FIXED", value: rs(500), minOrder: rs(10000) },
      { code: "EID2025", type: "PERCENT", value: 15, expiresAt: new Date("2025-04-15"), isActive: true },
    ],
  });

  // Pages
  for (const [slug, page] of Object.entries(defaultPages)) {
    await db.page.create({ data: { slug, title: page.title, content: page.content } });
  }

  // Sample orders over the last 90 days
  const zoneRate = (city: string) => (city === "Lahore" ? rs(200) : ["Karachi", "Islamabad", "Rawalpindi"].includes(city) ? rs(300) : rs(450));
  const methods = ["cod", "cod", "cod", "cod", "bank", "jazzcash", "easypaisa"];
  const titles = Object.keys(productIds);
  const sold: Record<string, number> = {};
  let number = 10001;
  // Set SEED_SAMPLE_ORDERS="false" for a live store: keeps sample products, skips fake orders.
  const orderCount = process.env.SEED_SAMPLE_ORDERS === "false" ? 0 : 84;
  for (let i = 0; i < orderCount; i++) {
    const daysAgo = Math.floor(Math.pow(rand(), 1.4) * 90);
    const createdAt = new Date(Date.now() - daysAgo * 86400000 - Math.floor(rand() * 10) * 3600000);
    const itemCount = rand() < 0.65 ? 1 : rand() < 0.8 ? 2 : 3;
    const lines: { title: string; variantId?: string; variantName?: string; price: number; cost: number; qty: number; productId: string; image: string }[] = [];
    for (let j = 0; j < itemCount; j++) {
      const t = pick(titles);
      const prod = productIds[t];
      const v = prod.variants.length ? pick(prod.variants) : undefined;
      const qty = prod.price < rs(3000) ? 1 + Math.floor(rand() * 3) : 1;
      lines.push({ title: prod.title, productId: prod.id, variantId: v?.id, variantName: v?.name, price: v?.price ?? prod.price, cost: prod.cost, qty, image: prod.image });
      sold[prod.id] = (sold[prod.id] ?? 0) + qty;
    }
    const subtotal = lines.reduce((s, l) => s + l.price * l.qty, 0);
    const city = pick(cities);
    const shipping = subtotal >= storeDefaults.commerce.freeShippingThreshold ? 0 : zoneRate(city);
    const useDiscount = rand() < 0.15 && subtotal >= rs(5000);
    const discount = useDiscount ? Math.round(subtotal * 0.1 / 100) * 100 : 0;
    const method = pick(methods);
    let status: string;
    if (daysAgo > 7) status = rand() < 0.86 ? "DELIVERED" : rand() < 0.5 ? "CANCELLED" : "RETURNED";
    else if (daysAgo > 3) status = pick(["SHIPPED", "SHIPPED", "DELIVERED", "PACKED"]);
    else if (daysAgo > 0) status = pick(["CONFIRMED", "PACKED", "SHIPPED", "NEW"]);
    else status = pick(["NEW", "NEW", "CONFIRMED"]);
    const paymentStatus =
      method === "cod"
        ? status === "DELIVERED" ? "PAID" : "UNPAID"
        : status === "NEW" ? "AWAITING_VERIFICATION" : status === "CANCELLED" ? "REJECTED" : "PAID";
    const name = `${pick(firstNames)} ${pick(lastNames)}`;
    const phoneLocal = `03${Math.floor(rand() * 5)}${Math.floor(rand() * 10)}${String(Math.floor(rand() * 10000000)).padStart(7, "0")}`;
    const flow = ["NEW", "CONFIRMED", "PACKED", "SHIPPED", "DELIVERED"];
    const reached = flow.indexOf(status);
    const history =
      reached >= 0
        ? flow.slice(0, reached + 1).map((s, k) => ({ status: s, createdAt: new Date(createdAt.getTime() + k * 20 * 3600000), actor: k === 0 ? "customer" : "Store Owner" }))
        : [
            { status: "NEW", createdAt, actor: "customer" },
            { status, createdAt: new Date(createdAt.getTime() + 30 * 3600000), actor: "Store Owner" },
          ];

    await db.order.create({
      data: {
        number: number++,
        accessToken: crypto.randomBytes(16).toString("hex"),
        customerName: name,
        phone: phoneLocal,
        phoneNormalized: "92" + phoneLocal.slice(1),
        email: rand() < 0.6 ? `${name.split(" ")[0].toLowerCase()}${Math.floor(rand() * 100)}@example.com` : null,
        address: pick(streets),
        city,
        status,
        paymentMethod: method,
        paymentStatus,
        subtotal,
        discountTotal: discount,
        discountCode: useDiscount ? "WELCOME10" : null,
        shippingTotal: shipping,
        shippingZone: city,
        total: subtotal - discount + shipping,
        courierName: ["SHIPPED", "DELIVERED"].includes(status) ? pick(["TCS", "Leopards", "M&P", "Trax"]) : null,
        trackingNumber: ["SHIPPED", "DELIVERED"].includes(status) ? String(Math.floor(rand() * 1e10)) : null,
        stockRestored: status === "CANCELLED" || status === "RETURNED",
        createdAt,
        updatedAt: createdAt,
        items: {
          create: lines.map((l) => ({
            productId: l.productId,
            variantId: l.variantId,
            title: l.title,
            variantName: l.variantName,
            image: l.image,
            unitPrice: l.price,
            unitCost: l.cost,
            quantity: l.qty,
            lineTotal: l.price * l.qty,
          })),
        },
        history: { create: history },
      },
    });
  }
  for (const [id, count] of Object.entries(sold)) {
    await db.product.update({ where: { id }, data: { soldCount: count } });
  }

  await db.adminNotification.create({
    data: { type: "INFO", title: "Welcome to your store", body: "Sample data has been added. Change your password and update Settings to make the store yours.", link: "/admin/settings" },
  });

  console.log(`Seeded ${categories.length} categories, ${products.length} products, ${orderCount} orders.`);
  console.log("Admin login: admin@hobbyshobby.local / ChangeMe123!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
