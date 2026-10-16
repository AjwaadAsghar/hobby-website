"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Box, Loader2, Plus, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { saveProduct } from "./actions";
import { RichTextEditor } from "@/components/admin/rich-text-editor";
import { ImageManager, type ManagedImage } from "@/components/admin/image-manager";
import { uploadFile } from "@/lib/upload-client";
import { slugify } from "@/lib/format";
import { cn } from "@/lib/utils";

export type ProductFormValues = {
  id?: string;
  title: string;
  slug: string;
  shortDescription: string;
  description: string;
  price: string;
  compareAtPrice: string;
  costPrice: string;
  sku: string;
  brand: string;
  categoryId: string;
  skillLevel: "BEGINNER" | "INTERMEDIATE" | "EXPERT";
  status: "DRAFT" | "PUBLISHED";
  featured: boolean;
  stock: string;
  lowStockThreshold: string;
  specs: { key: string; value: string }[];
  inTheBox: string[];
  tags: string;
  images: ManagedImage[];
  modelUrl: string;
  optionNames: string[];
  variants: { id?: string; options: Record<string, string>; sku: string; price: string; stock: string }[];
  compatibleIds: string[];
};

const SPEC_SUGGESTIONS = ["Scale", "Motor", "Battery", "Range", "Run time", "Flight time", "Top speed", "Drive", "Channels", "Wingspan", "Weight", "Waterproof"];

const inputCls = (err?: string) => cn("h-12 w-full rounded-xl border-2 bg-background px-3", err ? "border-destructive" : "border-input");

function Field({ label, htmlFor, error, hint, children, className }: { label: string; htmlFor: string; error?: string; hint?: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={className}>
      <label htmlFor={htmlFor} className="mb-1.5 block font-semibold">
        {label}
      </label>
      {children}
      {hint && !error && <p className="mt-1 text-sm text-muted-foreground">{hint}</p>}
      {error && (
        <p className="mt-1 font-medium text-destructive" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

function Section({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border bg-card p-5 shadow-sm">
      <h2 className="text-lg font-bold">{title}</h2>
      {description && <p className="mb-4 text-sm text-muted-foreground">{description}</p>}
      <div className={description ? "" : "mt-4"}>{children}</div>
    </section>
  );
}

export function ProductForm({
  initial,
  categories,
  allProducts,
}: {
  initial: ProductFormValues;
  categories: { id: string; name: string }[];
  allProducts: { id: string; title: string }[];
}) {
  const router = useRouter();
  const [v, setV] = useState<ProductFormValues>(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, startSaving] = useTransition();
  const [modelUploading, setModelUploading] = useState(false);
  const [compatFilter, setCompatFilter] = useState("");
  const set = <K extends keyof ProductFormValues>(k: K, val: ProductFormValues[K]) => setV((x) => ({ ...x, [k]: val }));

  function submit(e: React.FormEvent) {
    e.preventDefault();
    startSaving(async () => {
      let res: Awaited<ReturnType<typeof saveProduct>>;
      try {
        res = await saveProduct(
          JSON.stringify({
            ...v,
            categoryId: v.categoryId || null,
            modelUrl: v.modelUrl || null,
            compareAtPrice: v.compareAtPrice || null,
            costPrice: v.costPrice === "" ? null : v.costPrice,
            stock: v.stock || 0,
            lowStockThreshold: v.lowStockThreshold || 0,
            variants: v.variants.map((x) => ({ ...x, price: x.price === "" ? null : x.price, stock: x.stock || 0 })),
          }),
        );
      } catch (err) {
        // Network drop, server timeout or a crash on the server: keep the form and say so.
        console.error(err);
        toast.error("Could not reach the server to save. Your changes are still here - please try again.");
        return;
      }
      if (res.ok && res.id) {
        setErrors({});
        toast.success("Product saved.");
        if (!v.id) router.replace(`/admin/products/${res.id}?created=1`);
        else router.refresh();
        return;
      }
      setErrors(res.fieldErrors ?? {});
      toast.error(res.error ?? "Could not save.");
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  const hasVariants = v.optionNames.filter(Boolean).length > 0;
  const variantStock = v.variants.reduce((s, x) => s + (Number(x.stock) || 0), 0);

  return (
    <form onSubmit={submit} noValidate className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
      <div className="space-y-6">
        {Object.keys(errors).length > 0 && (
          <div role="alert" className="rounded-2xl border-2 border-destructive/40 bg-destructive/5 p-4 font-medium text-destructive">
            Please fix the highlighted fields:
            <ul className="mt-1 list-disc pl-6 text-sm">
              {Object.entries(errors).map(([k, m]) => (
                <li key={k}>{m}</li>
              ))}
            </ul>
          </div>
        )}

        <Section title="Basic details">
          <div className="space-y-4">
            <Field label="Product name" htmlFor="title" error={errors.title}>
              <input
                id="title"
                value={v.title}
                onChange={(e) => {
                  const title = e.target.value;
                  setV((x) => ({ ...x, title, slug: !x.id && (!x.slug || x.slug === slugify(x.title)) ? slugify(title) : x.slug }));
                }}
                className={inputCls(errors.title)}
              />
            </Field>
            <Field label="Short description" htmlFor="short" hint="One or two sentences shown near the price." error={errors.shortDescription}>
              <textarea id="short" rows={2} value={v.shortDescription} onChange={(e) => set("shortDescription", e.target.value)} className="w-full rounded-xl border-2 border-input bg-background px-3 py-2" />
            </Field>
            <div>
              <label htmlFor="desc" className="mb-1.5 block font-semibold">
                Full description
              </label>
              <RichTextEditor id="desc" label="Full description" value={v.description} onChange={(html) => set("description", html)} />
            </div>
          </div>
        </Section>

        <Section title="Photos" description="Drag to reorder. Add a short description to each photo for people using screen readers.">
          <ImageManager images={v.images} onChange={(imgs) => set("images", imgs)} defaultAlt={v.title} />
        </Section>

        <Section title="3D model (optional)" description="Upload a .glb file to show a “View in 3D” button on the product page.">
          {v.modelUrl ? (
            <div className="flex flex-wrap items-center gap-3 rounded-xl bg-muted p-3">
              <Box className="size-5" aria-hidden />
              <span className="min-w-0 flex-1 truncate font-mono text-sm">{v.modelUrl}</span>
              <button type="button" onClick={() => set("modelUrl", "")} className="inline-flex h-10 items-center gap-1 rounded-lg px-3 font-medium text-destructive hover:bg-destructive/5">
                <Trash2 className="size-4" aria-hidden /> Remove
              </button>
            </div>
          ) : (
            <label className="inline-flex h-11 cursor-pointer items-center gap-2 rounded-xl border-2 border-input px-4 font-semibold hover:bg-muted">
              {modelUploading ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Box className="size-4" aria-hidden />}
              {modelUploading ? "Uploading…" : "Upload .glb file"}
              <input
                type="file"
                accept=".glb,model/gltf-binary"
                className="sr-only"
                onChange={async (e) => {
                  const f = e.target.files?.[0];
                  if (!f) return;
                  setModelUploading(true);
                  try {
                    set("modelUrl", await uploadFile(f, "models", "model"));
                  } catch (err) {
                    toast.error((err as Error).message);
                  } finally {
                    setModelUploading(false);
                  }
                }}
              />
            </label>
          )}
        </Section>

        <Section title="Pricing">
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Price" htmlFor="price" error={errors.price}>
              <input id="price" inputMode="decimal" value={v.price} onChange={(e) => set("price", e.target.value)} className={inputCls(errors.price)} />
            </Field>
            <Field label="Compare-at price" htmlFor="compare" hint="Old price, shown crossed out." error={errors.compareAtPrice}>
              <input id="compare" inputMode="decimal" value={v.compareAtPrice} onChange={(e) => set("compareAtPrice", e.target.value)} className={inputCls(errors.compareAtPrice)} />
            </Field>
            <Field label="Cost price" htmlFor="cost" hint="What you paid. Only used for profit reports." error={errors.costPrice}>
              <input id="cost" inputMode="decimal" value={v.costPrice} onChange={(e) => set("costPrice", e.target.value)} className={inputCls(errors.costPrice)} />
            </Field>
          </div>
          {Number(v.price) > 0 && Number(v.costPrice) > 0 && (
            <p className="mt-3 text-sm text-muted-foreground">
              Profit per sale: <strong className="text-foreground">{(Number(v.price) - Number(v.costPrice)).toLocaleString()}</strong> ({Math.round(((Number(v.price) - Number(v.costPrice)) / Number(v.price)) * 100)}% margin)
            </p>
          )}
        </Section>

        <Section title="Variants" description="Add options like Color, Scale or RTR / Kit. Each combination can have its own price, SKU and stock.">
          <div className="mb-4">
            <p className="mb-1.5 font-semibold">Option names</p>
            <div className="flex flex-wrap items-center gap-2">
              {v.optionNames.map((name, i) => (
                <span key={i} className="inline-flex items-center gap-1 rounded-xl border-2 border-input bg-background pl-2">
                  <label className="sr-only" htmlFor={`opt-${i}`}>
                    Option name {i + 1}
                  </label>
                  <input
                    id={`opt-${i}`}
                    value={name}
                    onChange={(e) => {
                      const old = v.optionNames[i];
                      const nn = e.target.value;
                      setV((x) => ({
                        ...x,
                        optionNames: x.optionNames.map((n, k) => (k === i ? nn : n)),
                        variants: x.variants.map((vr) => {
                          const { [old]: val, ...rest } = vr.options;
                          return { ...vr, options: { ...rest, [nn]: val ?? "" } };
                        }),
                      }));
                    }}
                    placeholder="e.g. Color"
                    className="h-10 w-32 bg-transparent outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setV((x) => ({ ...x, optionNames: x.optionNames.filter((_, k) => k !== i), variants: x.optionNames.length === 1 ? [] : x.variants }))}
                    className="flex size-10 items-center justify-center rounded-lg hover:bg-muted"
                    aria-label={`Remove option ${name || i + 1}`}
                  >
                    <X className="size-4" aria-hidden />
                  </button>
                </span>
              ))}
              {v.optionNames.length < 3 && (
                <button
                  type="button"
                  onClick={() => setV((x) => ({ ...x, optionNames: [...x.optionNames, ["Color", "Scale", "Build"][x.optionNames.length] ?? ""] }))}
                  className="inline-flex h-11 items-center gap-1 rounded-xl border-2 border-dashed border-input px-3 font-semibold hover:bg-muted"
                >
                  <Plus className="size-4" aria-hidden /> Add option
                </button>
              )}
            </div>
          </div>
          {hasVariants && (
            <>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px] text-left">
                  <thead className="text-sm text-muted-foreground">
                    <tr>
                      {v.optionNames.map((n, i) => (
                        <th key={i} className="pb-2 font-semibold">
                          {n || `Option ${i + 1}`}
                        </th>
                      ))}
                      <th className="pb-2 font-semibold">Price (blank = product price)</th>
                      <th className="pb-2 font-semibold">SKU</th>
                      <th className="pb-2 font-semibold">Stock</th>
                      <th className="pb-2" />
                    </tr>
                  </thead>
                  <tbody>
                    {v.variants.map((vr, i) => (
                      <tr key={vr.id ?? `new-${i}`}>
                        {v.optionNames.map((n, k) => (
                          <td key={k} className="pr-2 pb-2">
                            <input
                              aria-label={`${n} for variant ${i + 1}`}
                              value={vr.options[n] ?? ""}
                              onChange={(e) => setV((x) => ({ ...x, variants: x.variants.map((y, j) => (j === i ? { ...y, options: { ...y.options, [n]: e.target.value } } : y)) }))}
                              className="h-11 w-full rounded-lg border-2 border-input bg-background px-2"
                            />
                          </td>
                        ))}
                        <td className="pr-2 pb-2">
                          <input aria-label={`Price for variant ${i + 1}`} inputMode="decimal" value={vr.price} onChange={(e) => setV((x) => ({ ...x, variants: x.variants.map((y, j) => (j === i ? { ...y, price: e.target.value } : y)) }))} className="h-11 w-full rounded-lg border-2 border-input bg-background px-2" />
                        </td>
                        <td className="pr-2 pb-2">
                          <input aria-label={`SKU for variant ${i + 1}`} value={vr.sku} onChange={(e) => setV((x) => ({ ...x, variants: x.variants.map((y, j) => (j === i ? { ...y, sku: e.target.value } : y)) }))} className="h-11 w-full rounded-lg border-2 border-input bg-background px-2" />
                        </td>
                        <td className="pr-2 pb-2">
                          <input aria-label={`Stock for variant ${i + 1}`} inputMode="numeric" value={vr.stock} onChange={(e) => setV((x) => ({ ...x, variants: x.variants.map((y, j) => (j === i ? { ...y, stock: e.target.value } : y)) }))} className="h-11 w-24 rounded-lg border-2 border-input bg-background px-2" />
                        </td>
                        <td className="pb-2">
                          <button type="button" onClick={() => setV((x) => ({ ...x, variants: x.variants.filter((_, j) => j !== i) }))} className="flex size-11 items-center justify-center rounded-lg text-destructive hover:bg-destructive/5" aria-label={`Remove variant ${i + 1}`}>
                            <Trash2 className="size-4" aria-hidden />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <button
                type="button"
                onClick={() => setV((x) => ({ ...x, variants: [...x.variants, { options: {}, sku: "", price: "", stock: "0" }] }))}
                className="mt-2 inline-flex h-11 items-center gap-1 rounded-xl border-2 border-input px-4 font-semibold hover:bg-muted"
              >
                <Plus className="size-4" aria-hidden /> Add variant
              </button>
              {Object.keys(errors).some((k) => k.startsWith("variants")) && <p className="mt-2 font-medium text-destructive">Please check the variant rows (stock must be a whole number).</p>}
            </>
          )}
        </Section>

        <Section title="Specifications" description="Shown as a table on the product page.">
          <div className="space-y-2">
            {v.specs.map((s, i) => (
              <div key={i} className="flex gap-2">
                <input aria-label={`Spec name ${i + 1}`} list="spec-names" value={s.key} onChange={(e) => set("specs", v.specs.map((x, k) => (k === i ? { ...x, key: e.target.value } : x)))} placeholder="e.g. Scale" className="h-11 w-2/5 rounded-lg border-2 border-input bg-background px-2" />
                <input aria-label={`Spec value ${i + 1}`} value={s.value} onChange={(e) => set("specs", v.specs.map((x, k) => (k === i ? { ...x, value: e.target.value } : x)))} placeholder="e.g. 1:10" className="h-11 flex-1 rounded-lg border-2 border-input bg-background px-2" />
                <button type="button" onClick={() => set("specs", v.specs.filter((_, k) => k !== i))} className="flex size-11 shrink-0 items-center justify-center rounded-lg text-destructive hover:bg-destructive/5" aria-label={`Remove spec ${s.key || i + 1}`}>
                  <Trash2 className="size-4" aria-hidden />
                </button>
              </div>
            ))}
            <datalist id="spec-names">
              {SPEC_SUGGESTIONS.map((s) => (
                <option key={s} value={s} />
              ))}
            </datalist>
            <button type="button" onClick={() => set("specs", [...v.specs, { key: "", value: "" }])} className="inline-flex h-11 items-center gap-1 rounded-xl border-2 border-input px-4 font-semibold hover:bg-muted">
              <Plus className="size-4" aria-hidden /> Add spec
            </button>
          </div>
        </Section>

        <Section title="What's in the box">
          <div className="space-y-2">
            {v.inTheBox.map((s, i) => (
              <div key={i} className="flex gap-2">
                <input aria-label={`Box item ${i + 1}`} value={s} onChange={(e) => set("inTheBox", v.inTheBox.map((x, k) => (k === i ? e.target.value : x)))} className="h-11 flex-1 rounded-lg border-2 border-input bg-background px-2" />
                <button type="button" onClick={() => set("inTheBox", v.inTheBox.filter((_, k) => k !== i))} className="flex size-11 shrink-0 items-center justify-center rounded-lg text-destructive hover:bg-destructive/5" aria-label={`Remove box item ${i + 1}`}>
                  <Trash2 className="size-4" aria-hidden />
                </button>
              </div>
            ))}
            <button type="button" onClick={() => set("inTheBox", [...v.inTheBox, ""])} className="inline-flex h-11 items-center gap-1 rounded-xl border-2 border-input px-4 font-semibold hover:bg-muted">
              <Plus className="size-4" aria-hidden /> Add item
            </button>
          </div>
        </Section>

        <Section title="Compatible parts" description="Products shown under “Compatible parts & accessories”. Links work both ways.">
          <input value={compatFilter} onChange={(e) => setCompatFilter(e.target.value)} placeholder="Filter products…" aria-label="Filter products" className="mb-2 h-11 w-full rounded-lg border-2 border-input bg-background px-3" />
          <div className="max-h-64 overflow-y-auto rounded-xl border p-2">
            {allProducts
              .filter((p) => p.id !== v.id && p.title.toLowerCase().includes(compatFilter.toLowerCase()))
              .map((p) => (
                <label key={p.id} className="flex min-h-10 cursor-pointer items-center gap-3 rounded-lg px-2 hover:bg-muted">
                  <input
                    type="checkbox"
                    checked={v.compatibleIds.includes(p.id)}
                    onChange={() => set("compatibleIds", v.compatibleIds.includes(p.id) ? v.compatibleIds.filter((x) => x !== p.id) : [...v.compatibleIds, p.id])}
                    className="size-5 accent-[var(--brand)]"
                  />
                  {p.title}
                </label>
              ))}
          </div>
        </Section>
      </div>

      <div className="space-y-6 xl:sticky xl:top-20 xl:self-start">
        <Section title="Status">
          <div className="space-y-4">
            <fieldset>
              <legend className="sr-only">Visibility</legend>
              {(["PUBLISHED", "DRAFT"] as const).map((s) => (
                <label key={s} className="flex min-h-11 cursor-pointer items-center gap-3">
                  <input type="radio" name="status" checked={v.status === s} onChange={() => set("status", s)} className="size-5 accent-[var(--brand)]" />
                  <span>
                    <span className="block font-semibold">{s === "PUBLISHED" ? "Published" : "Draft"}</span>
                    <span className="block text-sm text-muted-foreground">{s === "PUBLISHED" ? "Visible in the store" : "Hidden from customers"}</span>
                  </span>
                </label>
              ))}
            </fieldset>
            <label className="flex min-h-11 cursor-pointer items-center gap-3">
              <input type="checkbox" checked={v.featured} onChange={(e) => set("featured", e.target.checked)} className="size-5 accent-[var(--brand)]" />
              <span className="font-semibold">Show in “Featured products”</span>
            </label>
            <button disabled={saving} className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-brand font-semibold text-brand-foreground disabled:opacity-60">
              {saving && <Loader2 className="size-4 animate-spin" aria-hidden />}
              {v.id ? "Save changes" : "Create product"}
            </button>
          </div>
        </Section>

        <Section title="Organisation">
          <div className="space-y-4">
            <Field label="Category" htmlFor="category">
              <select id="category" value={v.categoryId} onChange={(e) => set("categoryId", e.target.value)} className={inputCls()}>
                <option value="">No category</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Brand" htmlFor="brand">
              <input id="brand" value={v.brand} onChange={(e) => set("brand", e.target.value)} className={inputCls()} />
            </Field>
            <Field label="Skill level" htmlFor="skill">
              <select id="skill" value={v.skillLevel} onChange={(e) => set("skillLevel", e.target.value as ProductFormValues["skillLevel"])} className={inputCls()}>
                <option value="BEGINNER">Beginner</option>
                <option value="INTERMEDIATE">Intermediate</option>
                <option value="EXPERT">Expert</option>
              </select>
            </Field>
            <Field label="Tags" htmlFor="tags" hint="Comma separated. Helps search, e.g. basher, 4x4, waterproof">
              <input id="tags" value={v.tags} onChange={(e) => set("tags", e.target.value)} className={inputCls()} />
            </Field>
            <Field label="Web address (slug)" htmlFor="slug" hint={`/product/${v.slug || "…"}`} error={errors.slug}>
              <input id="slug" value={v.slug} onChange={(e) => set("slug", slugify(e.target.value))} className={inputCls(errors.slug)} />
            </Field>
          </div>
        </Section>

        <Section title="Inventory">
          <div className="space-y-4">
            <Field label="SKU" htmlFor="sku" error={errors.sku}>
              <input id="sku" value={v.sku} onChange={(e) => set("sku", e.target.value)} className={inputCls(errors.sku)} />
            </Field>
            {hasVariants ? (
              <p className="rounded-xl bg-muted p-3 text-sm">
                Stock is managed per variant. Total: <strong>{variantStock}</strong>
              </p>
            ) : (
              <Field label="Stock" htmlFor="stock" error={errors.stock}>
                <input id="stock" inputMode="numeric" value={v.stock} onChange={(e) => set("stock", e.target.value)} className={inputCls(errors.stock)} />
              </Field>
            )}
            <Field label="Low stock alert at" htmlFor="low" hint="You get an alert when stock drops to this number." error={errors.lowStockThreshold}>
              <input id="low" inputMode="numeric" value={v.lowStockThreshold} onChange={(e) => set("lowStockThreshold", e.target.value)} className={inputCls(errors.lowStockThreshold)} />
            </Field>
          </div>
        </Section>

        {v.id && v.status === "PUBLISHED" && (
          <Link href={`/product/${v.slug}`} target="_blank" className="block text-center font-semibold underline underline-offset-4">
            View in store →
          </Link>
        )}
      </div>
    </form>
  );
}
