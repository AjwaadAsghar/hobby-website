"use client";

import { useId, useState } from "react";
import { ImagePlus, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { uploadFile } from "@/lib/upload-client";
import { cn } from "@/lib/utils";

export const adminInput = (err?: string) => cn("h-12 w-full rounded-xl border-2 bg-background px-3", err ? "border-destructive" : "border-input");

export function TextField({
  label,
  value,
  onChange,
  hint,
  error,
  type = "text",
  multiline,
  placeholder,
  inputMode,
  className,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  hint?: string;
  error?: string;
  type?: string;
  multiline?: boolean;
  placeholder?: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
  className?: string;
}) {
  const id = useId();
  const describedBy = [hint && `${id}-hint`, error && `${id}-err`].filter(Boolean).join(" ") || undefined;
  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1.5 block font-semibold">
        {label}
      </label>
      {multiline ? (
        <textarea id={id} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} rows={3} aria-invalid={!!error} aria-describedby={describedBy} className={cn(adminInput(error), "h-auto py-2")} />
      ) : (
        <input id={id} type={type} inputMode={inputMode} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} aria-invalid={!!error} aria-describedby={describedBy} className={adminInput(error)} />
      )}
      {hint && (
        <p id={`${id}-hint`} className="mt-1 text-sm text-muted-foreground">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-err`} className="mt-1 font-medium text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}

export function Toggle({ label, description, checked, onChange }: { label: string; description?: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex min-h-11 cursor-pointer items-start gap-3">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="mt-1 size-5 shrink-0 accent-[var(--brand)]" />
      <span>
        <span className="block font-semibold">{label}</span>
        {description && <span className="block text-sm text-muted-foreground">{description}</span>}
      </span>
    </label>
  );
}

/** Single image (or GLB) upload with preview and remove. */
export function UploadField({
  label,
  value,
  onChange,
  folder,
  kind = "image",
  hint,
}: {
  label: string;
  value: string;
  onChange: (url: string) => void;
  folder: string;
  kind?: "image" | "model";
  hint?: string;
}) {
  const [busy, setBusy] = useState(false);
  const id = useId();
  return (
    <div>
      <p className="mb-1.5 font-semibold" id={`${id}-label`}>
        {label}
      </p>
      <div className="flex flex-wrap items-center gap-3">
        {value && kind === "image" && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={value} alt="" className="h-16 max-w-48 rounded-lg border bg-muted object-contain p-1" />
        )}
        {value && kind === "model" && <span className="max-w-xs truncate rounded-lg bg-muted px-3 py-2 font-mono text-sm">{value}</span>}
        <label className="inline-flex h-11 cursor-pointer items-center gap-2 rounded-xl border-2 border-input px-4 font-semibold hover:bg-muted">
          {busy ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <ImagePlus className="size-4" aria-hidden />}
          {value ? "Replace" : "Upload"}
          <input
            type="file"
            accept={kind === "model" ? ".glb,model/gltf-binary" : "image/*"}
            aria-labelledby={`${id}-label`}
            className="sr-only"
            onChange={async (e) => {
              const f = e.target.files?.[0];
              if (!f) return;
              setBusy(true);
              try {
                onChange(await uploadFile(f, folder, kind));
              } catch (err) {
                toast.error((err as Error).message);
              } finally {
                setBusy(false);
                e.target.value = "";
              }
            }}
          />
        </label>
        {value && (
          <button type="button" onClick={() => onChange("")} className="inline-flex h-11 items-center gap-1 rounded-xl px-3 font-medium text-destructive hover:bg-destructive/5">
            <Trash2 className="size-4" aria-hidden /> Remove
          </button>
        )}
      </div>
      {hint && <p className="mt-1 text-sm text-muted-foreground">{hint}</p>}
    </div>
  );
}

export function Card({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border bg-card p-5 shadow-sm">
      <h2 className="text-lg font-bold">{title}</h2>
      {description && <p className="text-sm text-muted-foreground">{description}</p>}
      <div className="mt-4 space-y-4">{children}</div>
    </section>
  );
}
