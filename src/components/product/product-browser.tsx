"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useInView } from "framer-motion";
import type { FilterState, Product, SortOption, ViewMode } from "@/types";
import { useProductQuery } from "@/hooks/useProductQuery";
import { ProductCard } from "./product-card";
import { ProductGridSkeleton } from "@/components/ui/skeletons";
import { PackageSearch } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { INFINITE_STEP, PAGE_SIZE } from "@/constants";
import { Button } from "@/components/ui/button";

interface ProductBrowserProps {
  products: Product[];
  term: string;
  filters: FilterState;
  sort: SortOption;
  view?: ViewMode;
  /** Load everything at once (used when term-driven relevance ranking). */
  pageSize?: number;
  onReset?: () => void;
}

/**
 * Search + filter + infinite scroll orchestrator.
 * Simulates async fetching with brief skeleton states on filter change.
 */
export function ProductBrowser({
  products,
  term,
  filters,
  sort,
  view = "grid",
  pageSize = PAGE_SIZE,
  onReset,
}: ProductBrowserProps) {
  const results = useProductQuery(products, term, filters, sort);

  /* simulate network latency on query changes for loading states */
  const [ready, setReady] = useState(false);
  const firstRender = useRef(true);
  const queryKey = `${term}|${JSON.stringify(filters)}|${sort}`;
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      setReady(true);
      return;
    }
    setReady(false);
    const t = window.setTimeout(() => setReady(true), 420);
    return () => window.clearTimeout(t);
  }, [queryKey]);

  /* infinite scroll */
  const [visibleCount, setVisibleCount] = useState(pageSize);
  useEffect(() => setVisibleCount(pageSize), [queryKey, pageSize]);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const inView = useInView(sentinelRef, { margin: "600px 0px" });
  useEffect(() => {
    if (inView && ready) setVisibleCount((c) => Math.min(results.length, c + INFINITE_STEP));
  }, [inView, ready, results.length]);

  const loadMore = useCallback(
    () => setVisibleCount((c) => Math.min(results.length, c + INFINITE_STEP)),
    [results.length]
  );

  if (!ready) {
    return <ProductGridSkeleton count={pageSize < 8 ? pageSize : 8} />;
  }

  if (results.length === 0) {
    return (
      <EmptyState
        icon={PackageSearch}
        title="No products match those filters"
        description="Try adjusting the search or clearing one or more filters."
        secondaryAction={{ label: "Reset all filters", onClick: onReset }}
      />
    );
  }

  const visible = results.slice(0, visibleCount);

  return (
    <div>
      <div
        className={
          view === "grid"
            ? "grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4"
            : "flex flex-col gap-3"
        }
        role="list"
        aria-label={`${results.length} products`}
      >
        {visible.map((p, i) => (
          <div key={p.id} role="listitem">
            <ProductCard product={p} view={view} priority={i < 4} />
          </div>
        ))}
      </div>

      {/* infinite loading sentinel */}
      <div ref={sentinelRef} aria-hidden className="h-px" />

      {visibleCount < results.length && (
        <div className="mt-8 flex flex-col items-center gap-3">
          <p className="text-xs text-graymute">
            Showing {visible.length} of {results.length} products
          </p>
          <Button variant="outline" onClick={loadMore} className="rounded-xl border-forest-200 text-forest-800">
            Load more
          </Button>
        </div>
      )}
    </div>
  );
}
