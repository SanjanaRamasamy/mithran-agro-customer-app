"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Clock, Loader2, Search, Sprout, TrendingUp, X, XCircle } from "lucide-react";
import { useDebounce } from "@/hooks/useDebounce";
import { useActivity } from "@/contexts/ActivityContext";
import { useToast } from "@/contexts/NotificationContext";
import { searchProducts } from "@/hooks/useProductQuery";
import { useCatalog } from "@/contexts/CatalogContext";
import { SmartImage } from "@/components/ui/smart-image";
import { formatPrice, titleCase } from "@/utils/format";
import { getLowestVariantPrice } from "@/utils/product";
import { cn } from "@/lib/utils";

/** Instant search field with suggestions, recents, and keyboard navigation. */
export function SearchBar({ className, autoFocusOnMount = false }: { className?: string; autoFocusOnMount?: boolean }) {
  const router = useRouter();
  const { products, categories, farms, status } = useCatalog();
  const { recentSearches, trackSearch, removeSearch, clearSearchHistory } = useActivity();
  const { toast } = useToast();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const debounced = useDebounce(query, 180);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (autoFocusOnMount) inputRef.current?.focus();
  }, [autoFocusOnMount]);

  /* close on outside click */
  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  const productHits = useMemo(() => {
    if (!debounced.trim()) return [];
    return searchProducts(products, debounced).slice(0, 5);
  }, [debounced, products]);

  const categoryHits = useMemo(() => {
    if (!debounced.trim()) return [];
    return categories.filter((category) =>
      category.active && category.name.toLowerCase().includes(debounced.trim().toLowerCase())
    ).slice(0, 3);
  }, [debounced, categories]);

  const farmHits = useMemo(() => {
    const q = debounced.trim().toLowerCase();
    if (!q) return [];
    return farms.filter(
      (farm) =>
        farm.name.toLowerCase().includes(q) ||
        farm.location.toLowerCase().includes(q) ||
        farm.ownerName.toLowerCase().includes(q)
    ).slice(0, 3);
  }, [debounced, farms]);

  const popularProducts = products.slice(0, 5);
  const loading = status === "loading";

  const totalSuggestions = productHits.length + categoryHits.length + farmHits.length;

  const go = useCallback(
    (term: string) => {
      const t = term.trim();
      if (!t) return;
      trackSearch(t);
      setOpen(false);
      router.push(`/search?q=${encodeURIComponent(t)}`);
    },
    [router, trackSearch]
  );

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      setOpen(false);
      inputRef.current?.blur();
      return;
    }
    if (!open) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      const itemCount = debounced.trim()
        ? totalSuggestions + recentSearches.length
        : popularProducts.length + recentSearches.length;
      setActiveIndex((i) => Math.min(i + 1, itemCount - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, -1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (activeIndex >= 0) {
        if (!debounced.trim() && activeIndex < popularProducts.length) {
          router.push(`/products/${popularProducts[activeIndex].slug}`);
          setOpen(false);
        } else if (!debounced.trim()) {
          go(recentSearches[activeIndex - popularProducts.length]);
        } else if (activeIndex < productHits.length) {
          router.push(`/products/${productHits[activeIndex].slug || productHits[activeIndex].id}`);
          setOpen(false);
        } else {
          const catIdx = activeIndex - productHits.length;
          if (catIdx < categoryHits.length) {
            router.push(`/categories/${categoryHits[catIdx].slug}`);
            setOpen(false);
          } else {
            const farmIdx = catIdx - categoryHits.length;
            if (farmIdx < farmHits.length) {
              router.push(`/farms/${farmHits[farmIdx].slug}`);
              setOpen(false);
            } else {
              const recentIdx = farmIdx - farmHits.length;
              go(recentSearches[recentIdx]);
            }
          }
        }
      } else {
        go(query);
      }
    }
  };

  const showPanel = open && (query.trim().length > 0 || recentSearches.length > 0 || popularProducts.length > 0);

  return (
    <div ref={containerRef} className={cn("relative w-full", className)}>
      <form
        role="search"
        onSubmit={(e) => {
          e.preventDefault();
          go(query);
        }}
      >
        <label htmlFor="site-search" className="sr-only">
          Search organic produce
        </label>
        <div
          className={cn(
            "glass flex h-11 items-center gap-2 rounded-2xl px-3.5 transition-shadow",
            open && "ring-2 ring-forest-200"
          )}
        >
          <Search className="size-4 shrink-0 text-graymute" aria-hidden />
          <input
            id="site-search"
            ref={inputRef}
            type="search"
            value={query}
            placeholder="Search the store catalogue…"
            className="h-full min-w-0 flex-1 bg-transparent text-sm text-charcoal outline-none placeholder:text-graymute/70 [&::-webkit-search-cancel-button]:hidden"
            onChange={(e) => {
              setQuery(e.target.value);
              setOpen(true);
              setActiveIndex(-1);
            }}
            onFocus={() => setOpen(true)}
            onKeyDown={onKeyDown}
            autoComplete="off"
          />
          {loading && <Loader2 className="size-4 shrink-0 animate-spin text-forest-600" aria-hidden />}
          {query && !loading && (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                inputRef.current?.focus();
              }}
              aria-label="Clear search"
              className="rounded-full p-1 text-graymute transition hover:bg-soft hover:text-charcoal"
            >
              <X className="size-3.5" aria-hidden />
            </button>
          )}
        </div>
      </form>

      <AnimatePresence>
        {showPanel && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.99 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.99 }}
            transition={{ duration: 0.16, ease: "easeOut" }}
            className="glass-strong absolute inset-x-0 top-[calc(100%+8px)] z-50 max-h-[70vh] overflow-y-auto rounded-2xl p-2"
            role="listbox"
            aria-label="Search suggestions"
          >
            {/* Product hits */}
            {productHits.length > 0 && (
              <section aria-label="Matching products" className="mb-1">
                <p className="px-3 pb-1 pt-2 text-[10px] font-bold uppercase tracking-widest text-graymute">
                  Products
                </p>
                {productHits.map((p, i) => (
                  <button
                    key={p.id}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left transition",
                      activeIndex === i ? "bg-forest-50" : "hover:bg-soft"
                    )}
                    onClick={() => {
                      setOpen(false);
                      router.push(`/products/${p.slug}`);
                    }}
                  >
                    <SmartImage
                      src={p.images[0]}
                      alt={p.name}
                      emojiSeed={p.name}
                      fill={false}
                      width={80}
                      height={80}
                      rounded="rounded-lg"
                      className="size-11 shrink-0"
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-charcoal">{p.name}</span>
                      <span className="block truncate text-xs text-graymute">
                        {p.prestaShop?.categoryName || p.variants[0]?.name || ""}
                      </span>
                    </span>
                    <span className="shrink-0 text-sm font-bold text-forest-800">
                      {formatPrice(getLowestVariantPrice(p).price)}
                    </span>
                  </button>
                ))}
              </section>
            )}

            {/* Category hits */}
            {categoryHits.length > 0 && (
              <section aria-label="Matching categories" className="mb-1">
                <p className="px-3 pb-1 pt-2 text-[10px] font-bold uppercase tracking-widest text-graymute">
                  Categories
                </p>
                {categoryHits.map((c, i) => {
                  const idx = productHits.length + i;
                  return (
                    <button
                      key={c.id}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left transition",
                        activeIndex === idx ? "bg-forest-50" : "hover:bg-soft"
                      )}
                      onClick={() => {
                        setOpen(false);
                        router.push(`/search?category=${c.slug}`);
                      }}
                    >
                      <span className="flex size-9 items-center justify-center rounded-lg bg-lime-soft text-sm" aria-hidden>
                        🧺
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold text-charcoal">{c.name}</span>
                        <span className="block text-xs text-graymute">
                          {products.filter((product) => product.prestaShop?.categoryAncestorIds.includes(c.id)).length} products
                        </span>
                      </span>
                    </button>
                  );
                })}
              </section>
            )}

            {/* Farm hits */}
            {farmHits.length > 0 && (
              <section aria-label="Matching farms" className="border-t border-forest-50 pt-1">
                <p className="px-3 pb-1 pt-2 text-[10px] font-bold uppercase tracking-widest text-graymute">Farms</p>
                {farmHits.map((f, i) => {
                  const idx = productHits.length + categoryHits.length + farmHits.length + i;
                  return (
                    <button
                      key={f.id}
                      role="option"
                      aria-selected={activeIndex === idx}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left transition",
                        activeIndex === idx ? "bg-forest-50" : "hover:bg-soft"
                      )}
                      onClick={() => {
                        setOpen(false);
                        router.push(`/farms/${f.slug}`);
                      }}
                    >
                      <span className="flex size-9 items-center justify-center rounded-lg bg-forest-50 text-forest-800" aria-hidden>
                        <Sprout className="size-4" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold text-charcoal">{f.name}</span>
                        <span className="block truncate text-xs text-graymute">
                          {f.location || `${f.productIds.length} products`}
                        </span>
                      </span>
                    </button>
                  );
                })}
              </section>
            )}

            {/* Recent searches */}
            {recentSearches.length > 0 && (
              <section aria-label="Recent searches" className="border-t border-forest-50 pt-1">
                <div className="flex items-center justify-between px-3 pb-1 pt-2">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-graymute">Recent</p>
                  <button
                    onClick={clearSearchHistory}
                    className="text-[11px] font-semibold text-forest-700 hover:text-forest-900"
                  >
                    Clear all
                  </button>
                </div>
                {recentSearches.map((s, i) => {
                  const idx = productHits.length + categoryHits.length + farmHits.length + i;
                  return (
                    <div
                      key={s}
                      className={cn(
                        "group flex w-full items-center gap-3 rounded-xl px-3 py-2 transition",
                        activeIndex === idx ? "bg-forest-50" : "hover:bg-soft"
                      )}
                    >
                      <button className="flex min-w-0 flex-1 items-center gap-3 text-left" onClick={() => go(s)}>
                        <Clock className="size-4 shrink-0 text-graymute" aria-hidden />
                        <span className="truncate text-sm text-charcoal">{s}</span>
                      </button>
                      <button
                        onClick={() => removeSearch(s)}
                        aria-label={`Remove "${s}" from history`}
                        className="rounded-full p-1 text-graymute opacity-0 transition group-hover:opacity-100 hover:bg-white hover:text-red-600"
                      >
                        <XCircle className="size-4" aria-hidden />
                      </button>
                    </div>
                  );
                })}
              </section>
            )}

            {/* No matches */}
            {query.trim() && totalSuggestions === 0 && (
              <div className="px-4 py-6 text-center">
                <p className="text-sm font-semibold text-charcoal">No matches for “{query}”</p>
                <p className="mt-1 text-xs text-graymute">
                  Try another search or browse all {products.length} products.
                </p>
              </div>
            )}

            {/* Popular when empty query */}
            {!query.trim() && popularProducts.length > 0 && (
              <section aria-label="Popular searches" className="px-3 py-2">
                <p className="flex items-center gap-1.5 pb-2 text-[10px] font-bold uppercase tracking-widest text-graymute">
                  <TrendingUp className="size-3.5" aria-hidden /> From the store catalogue
                </p>
                <div className="flex flex-wrap gap-2">
                  {popularProducts.map((product) => (
                    <button
                      key={product.id}
                      onClick={() => router.push(`/products/${product.slug}`)}
                      className="rounded-full border border-forest-100 bg-white/70 px-3 py-1.5 text-xs font-medium text-forest-800 transition hover:border-forest-200 hover:bg-forest-50"
                    >
                      {product.name}
                    </button>
                  ))}
                </div>
              </section>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
