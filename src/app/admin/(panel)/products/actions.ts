"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import Papa from "papaparse";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-helpers";
import { slugify } from "@/lib/format";
import { toMinor } from "@/lib/money";
import { sanitizeRichText } from "@/lib/sanitize";
import { productFormSchema } from "@/lib/validation/product";

export type SaveResult = { ok?: boolean; id?: string; error?: string; fieldErrors?: Record<string, string> };

/** Last meaningful line of an error (Prisma puts the actual reason at the end). Admin-only, so safe to show. */
function lastLine(err: unknown): string {
  const lines = String((err as Error)?.message ?? err).split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  return lines.pop() ?? "unknown error";
}

async function uniqueSlug(base: string, excludeId?: string) {
  const root = slugify(base) || "product";
  let slug = root;
  for (let i = 2; i < 200; i++) {
    const taken = await db.product.findFirst({ where: { slug, ...(excludeId ? { id: { not: excludeId } } : {}) }, select: { id: true } });
    if (!taken) return slug;
    slug = `${root}-${i}`;
  }
  return `${root}-${Date.now()}`;
}

export async function saveProduct(json: string): Promise<SaveResult> {
  try {
    await requireAdmin();
  } catch (err) {
    return { error: (err as Error).message || "Please sign in again." };
  }
  let raw: unknown;
  try {
    raw = JSON.parse(json);
  } catch {
    return { error: "Invalid data." };
  }
  const parsed = productFormSchema.safeParse(raw);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const i of parsed.error.issues) fieldErrors[i.path.join(".")] ??= i.message;
    return { error: "Please fix the highlighted fields.", fieldErrors };
  }
  const d = parsed.data;
  let slug: string;
  try {
    slug = await uniqueSlug(d.slug || d.title, d.id);
  } catch (err) {
    console.error("[saveProduct] slug", err);
    return { error: `Could not save the product: ${lastLine(err)}` };
  }
  const optionNames = d.optionNames.filter(Boolean);
  const variants = optionNames.length
    ? d.variants
        .map((v) => {
          const options = Object.fromEntries(optionNames.map((n) => [n, (v.options[n] ?? "").trim()]));
          return { ...v, options, name: optionNames.map((n) => options[n]).filter(Boolean).join(" / ") };
        })
        .filter((v) => v.name)
    : [];

  const data = {
    title: d.title,
    slug,
    shortDescription: d.shortDescription,
    description: sanitizeRichText(d.description),
    price: toMinor(d.price),
    compareAtPrice: d.compareAtPrice ? toMinor(d.compareAtPrice) : null,
    costPrice: d.costPrice !== null ? toMinor(d.costPrice) : null,
    sku: d.sku || null,
    brand: d.brand,
    categoryId: d.categoryId || null,
    skillLevel: d.skillLevel,
    status: d.status,
    featured: d.featured,
    stock: variants.length ? 0 : d.stock,
    lowStockThreshold: d.lowStockThreshold,
    specs: JSON.stringify(Object.fromEntries(d.specs.filter((s) => s.key && s.value).map((s) => [s.key, s.value]))),
    inTheBox: JSON.stringify(d.inTheBox.filter(Boolean)),
    tags: d.tags
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean)
      .join(", "),
    modelUrl: d.modelUrl || null,
  };

  try {
    const id = await db.$transaction(async (tx) => {
      const product = d.id ? await tx.product.update({ where: { id: d.id }, data }) : await tx.product.create({ data });
      await tx.productImage.deleteMany({ where: { productId: product.id } });
      if (d.images.length) {
        await tx.productImage.createMany({ data: d.images.map((img, i) => ({ productId: product.id, url: img.url, alt: img.alt, sortOrder: i })) });
      }
      const keepIds = variants.map((v) => v.id).filter((x): x is string => !!x);
      await tx.productVariant.deleteMany({ where: { productId: product.id, id: { notIn: keepIds } } });
      for (const [i, v] of variants.entries()) {
        const vdata = {
          name: v.name,
          options: JSON.stringify(v.options),
          sku: v.sku || null,
          price: v.price !== null && v.price !== undefined ? toMinor(v.price) : null,
          stock: v.stock,
          sortOrder: i,
        };
        if (v.id) await tx.productVariant.update({ where: { id: v.id }, data: vdata });
        else await tx.productVariant.create({ data: { ...vdata, productId: product.id } });
      }
      await tx.product.update({
        where: { id: product.id },
        data: { compatibleWith: { set: d.compatibleIds.filter((x) => x !== product.id).map((x) => ({ id: x })) } },
      });
      return product.id;
    }, { maxWait: 10_000, timeout: 30_000 });
    revalidatePath("/admin/products");
    revalidatePath(`/product/${slug}`);
    return { ok: true, id };
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return { error: "That SKU is already used by another product or variant. SKUs must be unique.", fieldErrors: { sku: "This SKU is already in use." } };
    }
    console.error("[saveProduct]", err);
    return { error: `Could not save the product: ${lastLine(err)}` };
  }
}

function ids(formData: FormData) {
  return formData.getAll("ids").map(String).filter(Boolean).slice(0, 500);
}

export async function bulkProducts(formData: FormData) {
  await requireAdmin();
  const action = String(formData.get("bulk") ?? "");
  const list = ids(formData);
  if (!list.length) return;
  if (action === "publish") await db.product.updateMany({ where: { id: { in: list } }, data: { status: "PUBLISHED" } });
  if (action === "draft") await db.product.updateMany({ where: { id: { in: list } }, data: { status: "DRAFT" } });
  if (action === "feature") await db.product.updateMany({ where: { id: { in: list } }, data: { featured: true } });
  if (action === "unfeature") await db.product.updateMany({ where: { id: { in: list } }, data: { featured: false } });
  if (action === "delete") await db.product.deleteMany({ where: { id: { in: list } } });
  revalidatePath("/admin/products");
}

export async function deleteProduct(formData: FormData) {
  await requireAdmin();
  await db.product.delete({ where: { id: String(formData.get("id")) } }).catch(() => null);
  revalidatePath("/admin/products");
  redirect("/admin/products?deleted=1");
}

export async function duplicateProduct(formData: FormData) {
  await requireAdmin();
  const src = await db.product.findUnique({ where: { id: String(formData.get("id")) }, include: { images: true, variants: true } });
  if (!src) return;
  const slug = await uniqueSlug(`${src.slug}-copy`);
  const copy = await db.product.create({
    data: {
      title: `${src.title} (copy)`,
      slug,
      shortDescription: src.shortDescription,
      description: src.description,
      price: src.price,
      compareAtPrice: src.compareAtPrice,
      costPrice: src.costPrice,
      sku: null,
      brand: src.brand,
      categoryId: src.categoryId,
      skillLevel: src.skillLevel,
      specs: src.specs,
      inTheBox: src.inTheBox,
      tags: src.tags,
      status: "DRAFT",
      stock: 0,
      lowStockThreshold: src.lowStockThreshold,
      modelUrl: src.modelUrl,
      images: { create: src.images.map((i) => ({ url: i.url, alt: i.alt, sortOrder: i.sortOrder })) },
      variants: { create: src.variants.map((v) => ({ name: v.name, options: v.options, price: v.price, stock: 0, sortOrder: v.sortOrder })) },
    },
  });
  redirect(`/admin/products/${copy.id}?duplicated=1`);
}

export type ImportResult = { ok?: boolean; created?: number; updated?: number; errors?: string[] };

/** CSV import - matches existing products by SKU, then slug. Same columns as the export. */
export async function importProductsCsv(_prev: ImportResult, formData: FormData): Promise<ImportResult> {
  await requireAdmin();
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) return { errors: ["Please choose a CSV file."] };
  if (file.size > 5 * 1024 * 1024) return { errors: ["The file is too large (max 5 MB)."] };
  const text = (await file.text()).replace(/^﻿/, "");
  const parsed = Papa.parse<Record<string, string>>(text, { header: true, skipEmptyLines: true, transformHeader: (h) => h.trim().toLowerCase() });
  if (!parsed.data.length) return { errors: ["The file has no rows."] };
  const categories = await db.category.findMany();
  const errors: string[] = [];
  let created = 0;
  let updated = 0;

  for (const [i, row] of parsed.data.entries()) {
    const line = i + 2;
    const title = row.title?.trim();
    const price = Number((row.price ?? "").replace(/,/g, ""));
    if (!title) {
      errors.push(`Row ${line}: missing title.`);
      continue;
    }
    if (!Number.isFinite(price) || price < 0) {
      errors.push(`Row ${line}: price "${row.price}" is not a number.`);
      continue;
    }
    const cat = row.category ? categories.find((c) => c.slug === row.category.trim() || c.name.toLowerCase() === row.category.trim().toLowerCase()) : undefined;
    if (row.category && !cat) errors.push(`Row ${line}: category "${row.category}" not found - left empty.`);
    const specs: Record<string, string> = {};
    for (const part of (row.specs ?? "").split("|")) {
      const [k, ...v] = part.split(":");
      if (k?.trim() && v.join(":").trim()) specs[k.trim()] = v.join(":").trim();
    }
    const num = (v: string | undefined) => (v && v.trim() !== "" && Number.isFinite(Number(v.replace(/,/g, ""))) ? Number(v.replace(/,/g, "")) : null);
    const skill = (row.skill_level ?? "").toUpperCase();
    const data = {
      title,
      shortDescription: row.short_description ?? "",
      description: sanitizeRichText(row.description ?? ""),
      price: toMinor(price),
      compareAtPrice: num(row.compare_at_price) ? toMinor(num(row.compare_at_price)!) : null,
      costPrice: num(row.cost_price) !== null ? toMinor(num(row.cost_price)!) : null,
      brand: row.brand ?? "",
      categoryId: cat?.id ?? null,
      skillLevel: ["BEGINNER", "INTERMEDIATE", "EXPERT"].includes(skill) ? skill : "BEGINNER",
      status: (row.status ?? "").toUpperCase() === "PUBLISHED" ? "PUBLISHED" : "DRAFT",
      featured: ["yes", "true", "1"].includes((row.featured ?? "").toLowerCase()),
      stock: Math.max(0, Math.floor(num(row.stock) ?? 0)),
      lowStockThreshold: Math.max(0, Math.floor(num(row.low_stock_threshold) ?? 3)),
      tags: row.tags ?? "",
      specs: JSON.stringify(specs),
      inTheBox: JSON.stringify((row.in_the_box ?? "").split("|").map((s) => s.trim()).filter(Boolean)),
    };
    const images = (row.image_urls ?? "").split("|").map((s) => s.trim()).filter((u) => /^https?:\/\/|^\//.test(u));
    try {
      const sku = row.sku?.trim() || null;
      const existing =
        (sku && (await db.product.findUnique({ where: { sku } }))) || (row.slug && (await db.product.findUnique({ where: { slug: row.slug.trim() } }))) || null;
      if (existing) {
        await db.product.update({ where: { id: existing.id }, data });
        if (images.length) {
          await db.productImage.deleteMany({ where: { productId: existing.id } });
          await db.productImage.createMany({ data: images.map((url, k) => ({ productId: existing.id, url, alt: title, sortOrder: k })) });
        }
        updated++;
      } else {
        await db.product.create({
          data: { ...data, sku, slug: await uniqueSlug(row.slug || title), images: { create: images.map((url, k) => ({ url, alt: title, sortOrder: k })) } },
        });
        created++;
      }
    } catch (err) {
      errors.push(`Row ${line}: ${(err as Error).message.split("\n").pop()}`);
    }
  }
  revalidatePath("/admin/products");
  return { ok: true, created, updated, errors: errors.slice(0, 50) };
}
