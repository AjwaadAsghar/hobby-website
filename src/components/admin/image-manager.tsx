"use client";

import { useEffect, useRef, useState } from "react";
import { DndContext, KeyboardSensor, PointerSensor, closestCenter, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { SortableContext, arrayMove, rectSortingStrategy, sortableKeyboardCoordinates, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ArrowLeft, ArrowRight, GripVertical, ImagePlus, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { uploadFile } from "@/lib/upload-client";
import { ProductImage } from "@/components/store/product-image";
import { cn } from "@/lib/utils";

export type ManagedImage = { url: string; alt: string };

function SortableImage({
  img,
  index,
  count,
  onAlt,
  onRemove,
  onMove,
}: {
  img: ManagedImage;
  index: number;
  count: number;
  onAlt: (v: string) => void;
  onRemove: () => void;
  onMove: (dir: -1 | 1) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: img.url });
  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn("rounded-2xl border bg-background p-2", isDragging && "z-10 shadow-xl")}
    >
      <div className="relative aspect-square overflow-hidden rounded-xl bg-muted">
        <ProductImage src={img.url} alt={img.alt} sizes="200px" />
        {index === 0 && <span className="absolute top-2 left-2 rounded-full bg-foreground px-2 py-0.5 text-xs font-bold text-background">Main image</span>}
        <button
          type="button"
          {...attributes}
          {...listeners}
          className="absolute top-2 right-2 flex size-9 cursor-grab items-center justify-center rounded-lg bg-background/90 shadow active:cursor-grabbing"
          aria-label={`Drag to reorder image ${index + 1}`}
        >
          <GripVertical className="size-4" aria-hidden />
        </button>
      </div>
      <label className="mt-2 block">
        <span className="sr-only">Description of image {index + 1} (alt text)</span>
        <input value={img.alt} onChange={(e) => onAlt(e.target.value)} placeholder="Describe the image" className="h-10 w-full rounded-lg border border-input bg-background px-2 text-sm" />
      </label>
      <div className="mt-2 flex flex-wrap items-center justify-between gap-1">
        <div className="flex gap-1">
          <button type="button" disabled={index === 0} onClick={() => onMove(-1)} className="flex size-9 items-center justify-center rounded-lg border hover:bg-muted disabled:opacity-30" aria-label="Move image earlier">
            <ArrowLeft className="size-4" aria-hidden />
          </button>
          <button type="button" disabled={index === count - 1} onClick={() => onMove(1)} className="flex size-9 items-center justify-center rounded-lg border hover:bg-muted disabled:opacity-30" aria-label="Move image later">
            <ArrowRight className="size-4" aria-hidden />
          </button>
        </div>
        <button type="button" onClick={onRemove} className="inline-flex h-9 items-center gap-1 rounded-lg px-2 text-sm font-medium text-destructive hover:bg-destructive/5">
          <Trash2 className="size-4" aria-hidden /> Remove
        </button>
      </div>
    </li>
  );
}

/** Drag-and-drop multi-image upload with reordering (mouse, touch and keyboard). */
export function ImageManager({ images, onChange, folder = "products", defaultAlt = "" }: { images: ManagedImage[]; onChange: (imgs: ManagedImage[]) => void; folder?: string; defaultAlt?: string }) {
  const [uploading, setUploading] = useState(0);
  const [over, setOver] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const latest = useRef(images);
  useEffect(() => {
    latest.current = images;
  }, [images]);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));

  async function addFiles(files: FileList | File[]) {
    const list = Array.from(files).filter((f) => f.type.startsWith("image/"));
    if (!list.length) {
      toast.error("Please choose image files (JPG, PNG, WEBP).");
      return;
    }
    setUploading((n) => n + list.length);
    for (const f of list) {
      try {
        const url = await uploadFile(f, folder, "image");
        onChange([...latest.current, { url, alt: defaultAlt }]);
      } catch (err) {
        toast.error(`${f.name}: ${(err as Error).message}`);
      } finally {
        setUploading((n) => n - 1);
      }
    }
  }

  function onDragEnd(e: DragEndEvent) {
    if (!e.over || e.active.id === e.over.id) return;
    const from = images.findIndex((i) => i.url === e.active.id);
    const to = images.findIndex((i) => i.url === e.over!.id);
    onChange(arrayMove(images, from, to));
  }

  return (
    <div>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setOver(true);
        }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setOver(false);
          if (e.dataTransfer.files.length) addFiles(e.dataTransfer.files);
        }}
        className={cn("flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-6 text-center transition", over ? "border-brand bg-brand-soft" : "border-input")}
      >
        <ImagePlus className="size-8 text-muted-foreground" aria-hidden />
        <p className="mt-2 font-semibold">Drag photos here</p>
        <p className="text-sm text-muted-foreground">JPG, PNG or WEBP, up to 8 MB each. The first image is the main one.</p>
        <button type="button" onClick={() => input.current?.click()} className="mt-3 h-11 rounded-xl border-2 border-input bg-background px-4 font-semibold hover:bg-muted">
          Choose photos
        </button>
        <input ref={input} type="file" accept="image/*" multiple className="sr-only" onChange={(e) => e.target.files && addFiles(e.target.files)} tabIndex={-1} aria-hidden />
        {uploading > 0 && (
          <p role="status" className="mt-3 inline-flex items-center gap-2 font-medium">
            <Loader2 className="size-4 animate-spin" aria-hidden /> Uploading {uploading} photo{uploading > 1 ? "s" : ""}…
          </p>
        )}
      </div>
      {images.length > 0 && (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
          <SortableContext items={images.map((i) => i.url)} strategy={rectSortingStrategy}>
            <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {images.map((img, i) => (
                <SortableImage
                  key={img.url}
                  img={img}
                  index={i}
                  count={images.length}
                  onAlt={(v) => onChange(images.map((x, k) => (k === i ? { ...x, alt: v } : x)))}
                  onRemove={() => onChange(images.filter((_, k) => k !== i))}
                  onMove={(dir) => onChange(arrayMove(images, i, i + dir))}
                />
              ))}
            </ul>
          </SortableContext>
        </DndContext>
      )}
    </div>
  );
}
