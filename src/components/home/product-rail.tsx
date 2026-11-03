"use client";

import { useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Product } from "@/types";
import { ProductCard } from "@/components/product/product-card";

interface ProductRailProps {
  products: Product[];
  priority?: boolean;
}

/** Horizontal snap-scroll rail with edge fade + arrow controls (desktop). */
export function ProductRail({ products, priority }: ProductRailProps) {
  const scroller = useRef<HTMLDivElement>(null);

  const scrollBy = (dir: 1 | -1) => {
    const el = scroller.current;
    if (!el) return;
    const card = el.querySelector<HTMLElement>("[data-rail-card]");
    const step = card ? card.offsetWidth + 16 : 240;
    el.scrollBy({ left: dir * step * 2, behavior: "smooth" });
  };

  return (
    <div className="relative">
      <div
        ref={scroller}
        className="no-scrollbar -mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0"
        role="list"
        aria-label="Product list"
      >
        {products.map((p, i) => (
          <div
            key={p.id}
            data-rail-card
            role="listitem"
            className="w-44 shrink-0 snap-start sm:w-52"
          >
            <ProductCard product={p} priority={priority && i < 4} />
          </div>
        ))}
      </div>

      {/* desktop arrows */}
      <button
        onClick={() => scrollBy(-1)}
        aria-label="Scroll left"
        className="glass absolute -left-4 top-1/2 z-10 hidden -translate-y-1/2 rounded-full p-2.5 text-charcoal transition hover:scale-105 hover:text-forest-900 lg:block"
      >
        <ChevronLeft className="size-5" aria-hidden />
      </button>
      <button
        onClick={() => scrollBy(1)}
        aria-label="Scroll right"
        className="glass absolute -right-4 top-1/2 z-10 hidden -translate-y-1/2 rounded-full p-2.5 text-charcoal transition hover:scale-105 hover:text-forest-900 lg:block"
      >
        <ChevronRight className="size-5" aria-hidden />
      </button>
    </div>
  );
}
