"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { Box, ZoomIn } from "lucide-react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ProductImage } from "@/components/store/product-image";
import { cn } from "@/lib/utils";

const ModelViewer = dynamic(() => import("@/components/three/model-viewer"), {
  ssr: false,
  loading: () => <div className="flex h-full items-center justify-center font-medium">Loading 3D viewer…</div>,
});

type Img = { url: string; alt: string };

export function ProductGallery({ images, title, modelUrl }: { images: Img[]; title: string; modelUrl: string | null }) {
  const [index, setIndex] = useState(0);
  const [mode, setMode] = useState<"photos" | "3d">("photos");
  const [zoomOrigin, setZoomOrigin] = useState<string | null>(null);
  const [lightbox, setLightbox] = useState(false);
  const current = images[index];

  function onMove(e: React.PointerEvent<HTMLButtonElement>) {
    if (e.pointerType !== "mouse") return;
    const r = e.currentTarget.getBoundingClientRect();
    setZoomOrigin(`${((e.clientX - r.left) / r.width) * 100}% ${((e.clientY - r.top) / r.height) * 100}%`);
  }

  return (
    <div className="lg:sticky lg:top-40">
      {modelUrl && (
        <div role="tablist" aria-label="Product view" className="mb-3 inline-flex rounded-xl border-2 border-input p-1">
          <button
            role="tab"
            aria-selected={mode === "photos"}
            onClick={() => setMode("photos")}
            className={cn("h-10 rounded-lg px-4 font-semibold", mode === "photos" && "bg-foreground text-background")}
          >
            Photos
          </button>
          <button
            role="tab"
            aria-selected={mode === "3d"}
            onClick={() => setMode("3d")}
            className={cn("inline-flex h-10 items-center gap-2 rounded-lg px-4 font-semibold", mode === "3d" && "bg-foreground text-background")}
          >
            <Box className="size-4" aria-hidden /> View in 3D
          </button>
        </div>
      )}

      <div className="relative aspect-square overflow-hidden rounded-3xl border bg-muted">
        {mode === "3d" && modelUrl ? (
          <div className="h-full w-full">
            <ModelViewer url={modelUrl} label={title} />
            <p className="pointer-events-none absolute right-0 bottom-3 left-0 text-center text-sm font-medium">Drag to turn · Scroll to zoom</p>
          </div>
        ) : (
          <button
            type="button"
            className="group relative block h-full w-full cursor-zoom-in"
            onPointerMove={onMove}
            onPointerLeave={() => setZoomOrigin(null)}
            onClick={() => setLightbox(true)}
            aria-label={`Click to enlarge: ${current?.alt || title}`}
          >
            <ProductImage
              src={current?.url}
              alt={current?.alt || title}
              priority
              sizes="(min-width: 1024px) 50vw, 100vw"
              className="transition-transform duration-200"
            />
            {zoomOrigin && current && (
              <span className="absolute inset-0 hidden md:block" style={{ transformOrigin: zoomOrigin, transform: "scale(2)" }} aria-hidden>
                <ProductImage src={current.url} alt="" sizes="100vw" />
              </span>
            )}
            <span className="absolute right-3 bottom-3 inline-flex items-center gap-1.5 rounded-full bg-background/90 px-3 py-1.5 text-sm font-semibold shadow">
              <ZoomIn className="size-4" aria-hidden /> Click to enlarge
            </span>
          </button>
        )}
      </div>

      {images.length > 1 && mode === "photos" && (
        <ul className="mt-4 grid grid-cols-5 gap-3" aria-label="Choose an image">
          {images.map((img, i) => (
            <li key={img.url + i}>
              <button
                type="button"
                onClick={() => setIndex(i)}
                aria-label={`Show image ${i + 1} of ${images.length}`}
                aria-current={i === index}
                className={cn(
                  "relative block aspect-square w-full overflow-hidden rounded-xl border-2 bg-muted transition",
                  i === index ? "border-foreground" : "border-transparent hover:border-input",
                )}
              >
                <ProductImage src={img.url} alt="" sizes="96px" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <Dialog open={lightbox} onOpenChange={setLightbox}>
        <DialogContent className="max-w-[min(92vw,1000px)] p-3 sm:max-w-[min(92vw,1000px)]">
          <DialogTitle className="sr-only">{title}</DialogTitle>
          <DialogDescription className="sr-only">Larger product image</DialogDescription>
          <div className="relative aspect-square w-full overflow-hidden rounded-2xl bg-muted">
            <ProductImage src={current?.url} alt={current?.alt || title} sizes="1000px" />
          </div>
          {images.length > 1 && (
            <div className="flex justify-center gap-3 pt-2">
              <button type="button" onClick={() => setIndex((index - 1 + images.length) % images.length)} className="h-12 rounded-xl border-2 border-input px-5 font-semibold">
                Previous image
              </button>
              <button type="button" onClick={() => setIndex((index + 1) % images.length)} className="h-12 rounded-xl border-2 border-input px-5 font-semibold">
                Next image
              </button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
