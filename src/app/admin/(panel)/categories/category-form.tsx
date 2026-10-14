"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { saveCategory } from "./actions";
import { TextField, Toggle, UploadField } from "@/components/admin/fields";

export type CategoryValues = { id?: string; name: string; slug: string; description: string; image: string; sortOrder: string; isActive: boolean };

export function CategoryForm({ initial }: { initial: CategoryValues }) {
  const router = useRouter();
  const [v, setV] = useState(initial);
  const [pending, start] = useTransition();
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        start(async () => {
          const res = await saveCategory(v);
          if (res.ok) {
            toast.success("Category saved.");
            router.push("/admin/categories");
            router.refresh();
          } else toast.error(res.error ?? "Could not save.");
        });
      }}
      className="space-y-4"
    >
      <TextField label="Name" value={v.name} onChange={(name) => setV({ ...v, name })} />
      <TextField label="Web address (slug)" value={v.slug} onChange={(slug) => setV({ ...v, slug })} hint={`/category/${v.slug || "made-from-name"}`} />
      <TextField label="Description" value={v.description} onChange={(description) => setV({ ...v, description })} multiline />
      <UploadField label="Tile image" value={v.image} onChange={(image) => setV({ ...v, image })} folder="categories" hint="Shown on the homepage “Shop by category” tiles." />
      <TextField label="Position" value={v.sortOrder} onChange={(sortOrder) => setV({ ...v, sortOrder })} inputMode="numeric" hint="Lower numbers come first in the menu." />
      <Toggle label="Show in the store" checked={v.isActive} onChange={(isActive) => setV({ ...v, isActive })} />
      <button disabled={pending} className="h-12 w-full rounded-xl bg-brand font-semibold text-brand-foreground disabled:opacity-60">
        {pending ? "Saving…" : v.id ? "Save category" : "Add category"}
      </button>
    </form>
  );
}
