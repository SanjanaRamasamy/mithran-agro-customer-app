"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Expand, ZoomIn } from "lucide-react";
import type { Product } from "@/types";
import { categoryKind } from "@/data/categories";
import { SmartImage, produceEmoji } from "@/components/ui/smart-image";
import { cn } from "@/lib/utils";

/** Product gallery — thumbnails, hover zoom, fullscreen dialog-style lightbox. */
export function ProductGallery({ product }: { product: Product }) {
  const kind = categoryKind(product);
  const images = product.images.length ? product.images : [""];
  const [active, setActive] = useState(0);
  const [zoom, setZoom] = useState(false);
  const [origin, setOrigin] = useState("50% 50%");
  const [lightbox, setLightbox] = useState(false);

  const onMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!zoom) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setOrigin(`${x}% ${y}%`);
  };

  return (
    <div className="space-y-3">
      <div
        className="group relative aspect-square overflow-hidden rounded-3xl bg-gradient-to-br from-forest-50 via-white to-lime-soft ring-1 ring-forest-50"
        onMouseEnter={() => setZoom(true)}
        onMouseLeave={() => setZoom(false)}
        onMouseMove={onMove}
        onClick={() => setLightbox(true)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === "Enter" && setLightbox(true)}
        aria-label={`${product.name} — click to zoom image ${active + 1} of ${images.length}`}
      >
        {/* Active image with transform zoom */}
        <div
          className="h-full w-full transition-transform duration-200"
          style={zoom ? { transform: "scale(1.75)", transformOrigin: origin } : undefined}
        >
          <SmartImage
            key={active}
            src={images[active]}
            alt={`${product.name} — image ${active + 1}`}
            emojiSeed={product.name}
            rounded="rounded-3xl"
            className="size-full"
            priority
            sizes="(max-width: 768px) 100vw, 50vw"
          />
        </div>
        <span className="glass absolute bottom-3 right-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold text-forest-900">
          <ZoomIn className="size-3.5" aria-hidden />
          Hover to zoom
        </span>
        {product.harvestDate && (
          <span className="glass absolute left-3 top-3 rounded-full px-3 py-1.5 text-xs font-bold text-forest-900">
            {kind === "produce"
              ? `🌅 Harvested ${new Date(product.harvestDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", timeZone: "Asia/Kolkata" })}`
              : `📦 Listed ${new Date(product.harvestDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", timeZone: "Asia/Kolkata" })}`}
          </span>
        )}
      </div>

      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="flex gap-2.5" role="tablist" aria-label="Product images">
          {images.map((src, i) => (
            <button
              key={i}
              role="tab"
              aria-selected={i === active}
              aria-label={`Image ${i + 1}`}
              onClick={() => setActive(i)}
              className={cn(
                "relative size-18 overflow-hidden rounded-xl ring-2 transition",
                i === active ? "ring-forest-800" : "ring-transparent hover:ring-forest-200"
              )}
            >
              <SmartImage
                src={src}
                alt=""
                emojiSeed={product.name}
                rounded="rounded-xl"
                className="size-full"
                sizes="72px"
              />
            </button>
          ))}
        </div>
      )}

      {/* Lightbox */}
      {lightbox && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[80] flex items-center justify-center bg-forest-950/70 p-6 backdrop-blur-sm"
          onClick={() => setLightbox(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Image preview"
        >
          <motion.div
            initial={{ scale: 0.92 }}
            animate={{ scale: 1 }}
            className="relative max-h-[85vh] w-full max-w-2xl"
          >
            <SmartImage
              src={images[active]}
              alt={product.name}
              emojiSeed={product.name}
              rounded="rounded-2xl"
              className="aspect-square w-full"
              sizes="800px"
            />
            <span className="glass absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full px-4 py-2 text-xs font-bold text-forest-950">
              {product.name} · image {active + 1}/{images.length}
            </span>
          </motion.div>
          <button
            className="glass absolute right-6 top-6 flex size-11 items-center justify-center rounded-full text-charcoal"
            aria-label="Close preview"
            onClick={() => setLightbox(false)}
          >
            <Expand className="size-5 rotate-45" aria-hidden />
          </button>
        </motion.div>
      )}
    </div>
  );
}

export { produceEmoji };
