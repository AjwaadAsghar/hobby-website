import { z } from "zod";

const money = z.coerce.number({ message: "Please enter a number." }).min(0, "Cannot be negative.").max(100_000_000, "That amount is too large.");
const optionalMoney = z.preprocess((v) => (v === "" || v === null || v === undefined ? null : v), money.nullable());

export const productImageSchema = z.object({ url: z.string().min(1).max(1000), alt: z.string().max(200).default("") });

export const productVariantSchema = z.object({
  id: z.string().max(40).optional(),
  options: z.record(z.string().max(40), z.string().trim().max(60)),
  sku: z.string().trim().max(60).optional().default(""),
  price: optionalMoney,
  stock: z.coerce.number().int("Stock must be a whole number.").min(0, "Stock cannot be negative.").max(1_000_000),
});

/** Prices here are in major units (rupees) - converted to minor units on save. */
export const productFormSchema = z
  .object({
    id: z.string().max(40).optional(),
    title: z.string().trim().min(2, "Please enter a product name.").max(160),
    slug: z
      .string()
      .trim()
      .max(90)
      .regex(/^[a-z0-9-]*$/, "Use only lowercase letters, numbers and dashes.")
      .optional()
      .default(""),
    shortDescription: z.string().trim().max(400).default(""),
    description: z.string().max(50_000).default(""),
    price: money,
    compareAtPrice: optionalMoney,
    costPrice: optionalMoney,
    sku: z.string().trim().max(60).default(""),
    brand: z.string().trim().max(60).default(""),
    categoryId: z.string().max(40).nullable().default(null),
    skillLevel: z.enum(["BEGINNER", "INTERMEDIATE", "EXPERT"]),
    status: z.enum(["DRAFT", "PUBLISHED"]),
    featured: z.boolean().default(false),
    stock: z.coerce.number().int("Stock must be a whole number.").min(0, "Stock cannot be negative.").max(1_000_000),
    lowStockThreshold: z.coerce.number().int().min(0).max(10_000),
    specs: z.array(z.object({ key: z.string().trim().max(60), value: z.string().trim().max(200) })).max(40).default([]),
    inTheBox: z.array(z.string().trim().max(200)).max(40).default([]),
    tags: z.string().max(400).default(""),
    images: z.array(productImageSchema).max(20).default([]),
    modelUrl: z.string().max(1000).nullable().default(null),
    optionNames: z.array(z.string().trim().min(1).max(40)).max(3).default([]),
    variants: z.array(productVariantSchema).max(100).default([]),
    compatibleIds: z.array(z.string().max(40)).max(100).default([]),
  })
  .refine((d) => d.compareAtPrice === null || d.compareAtPrice === 0 || d.compareAtPrice > d.price, {
    message: "The 'compare at' price should be higher than the selling price (or leave it empty).",
    path: ["compareAtPrice"],
  });

export type ProductFormInput = z.input<typeof productFormSchema>;
export type ProductFormData = z.output<typeof productFormSchema>;
