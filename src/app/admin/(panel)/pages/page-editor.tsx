"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { savePage } from "./actions";
import { RichTextEditor } from "@/components/admin/rich-text-editor";
import { TextField } from "@/components/admin/fields";

export function PageEditor({ slug, title, content }: { slug: string; title: string; content: string }) {
  const [t, setT] = useState(title);
  const [c, setC] = useState(content);
  const [pending, start] = useTransition();
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        start(async () => {
          const res = await savePage({ slug, title: t, content: c });
          if (res.ok) toast.success("Page saved.");
          else toast.error(res.error ?? "Could not save.");
        });
      }}
      className="space-y-4"
    >
      <TextField label="Title" value={t} onChange={setT} />
      <div>
        <label htmlFor="page-content" className="mb-1.5 block font-semibold">
          Content
        </label>
        <RichTextEditor id="page-content" label="Page content" value={c} onChange={setC} />
      </div>
      <div className="rounded-xl bg-muted p-4 text-sm">
        <p className="font-semibold">Tip: these words are replaced automatically with your current settings</p>
        <p className="mt-1 font-mono">{"{{storeName}} {{phone}} {{email}} {{whatsapp}} {{address}} {{freeShippingThreshold}}"}</p>
      </div>
      <button disabled={pending} className="h-12 rounded-xl bg-brand px-6 font-semibold text-brand-foreground disabled:opacity-60">
        {pending ? "Saving…" : "Save page"}
      </button>
    </form>
  );
}
