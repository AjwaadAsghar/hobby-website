import Image from "next/image";
import { ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * next/image wrapper: fills its (relative) parent, skips optimisation for SVG
 * placeholders and shows a neutral tile when there is no image.
 */
export function ProductImage({
  src,
  alt,
  sizes,
  className,
  priority,
}: {
  src: string | null | undefined;
  alt: string;
  sizes: string;
  className?: string;
  priority?: boolean;
}) {
  if (!src) {
    return (
      <span className={cn("absolute inset-0 flex items-center justify-center bg-muted text-muted-foreground", className)}>
        <ImageIcon className="size-1/4 max-h-12 max-w-12" aria-hidden />
        <span className="sr-only">{alt || "No image"}</span>
      </span>
    );
  }
  return (
    <Image
      src={src}
      alt={alt}
      fill
      sizes={sizes}
      priority={priority}
      unoptimized={src.endsWith(".svg")}
      className={cn("object-cover", className)}
    />
  );
}
