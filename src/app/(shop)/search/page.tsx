"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LayoutGrid, List, RefreshCw } from "lucide-react";
import { DEFAULT_FILTERS, matchesFilters, searchProducts } from "@/hooks/useProductQuery";
import type { FilterState, SortOption, ViewMode } from "@/types";
import { PRICE_BOUNDS, SORT_OPTIONS } from "@/constants";
import { CATEGORY_BY_SLUG, CATEGORY_GROUP_BY_ID } from "@/data/categories";
import { FiltersPanel } from "@/components/product/filters-panel";
import { CategoryTabs } from "@/components/product/category-tabs";
import { ProductBrowser } from "@/components/product/product-browser";
import { MobileFiltersTrigger } from "@/components/product/mobile-filters-trigger";
import { cn } from "@/lib/utils";
import { useCatalog } from "@/contexts/CatalogContext";

/** Build filter state + sort from the current URL params. */
function stateFromParams(params: URLSearchParams): { seed: FilterState; sort: SortOption } {
  const f: FilterState = { ...DEFAULT_FILTERS, priceRange: [...PRICE_BOUNDS] as [number, number] };
  const category = params.get("category");
  if (category) f.categories = [category];
  const seller = params.get("seller");
  if (seller) f.sellers = [seller];
  if (params.get("organic") === "1") f.organicOnly = true;
  if (params.get("seasonal") === "1") f.seasonalOnly = true;
  if (params.get("onsale") === "1") f.onSaleOnly = true;
  /* the deals page leads with the biggest savings unless the user picked a sort */
  const sort = (params.get("sort") as SortOption) ?? (f.onSaleOnly ? "discount-desc" : "relevance");
  return { seed: f, sort };
}

function SearchPageInner() {
  const router = useRouter();
  const params = useSearchParams();
  const { products, categories, status, error, reload } = useCatalog();

  const term = params.get("q") ?? "";

  /* URL is the source of truth — whenever it changes (header links, tabs,
     category pages), the URL-derived fields merge into local state so the
     two can never drift apart. Local-only fields (price, rating, …) persist. */
  const { seed, sort: urlSort } = useMemo(() => stateFromParams(params), [params]);

  const [filters, setFilters] = useState<FilterState>(seed);
  const [sort, setSort] = useState<SortOption>(urlSort);
  const [view, setView] = useState<ViewMode>("grid");

  useEffect(() => {
    setFilters((prev) => ({
      ...prev,
      categories: seed.categories,
      sellers: seed.sellers,
      organicOnly: seed.organicOnly,
      seasonalOnly: seed.seasonalOnly,
      onSaleOnly: seed.onSaleOnly,
    }));
    setSort(urlSort);
  }, [seed, urlSort]);

  const resultCount = useMemo(
    () => searchProducts(products, term).filter((p) => matchesFilters(p, filters)).length,
    [products, term, filters]
  );

  /* keep filters in sync with URL (shareable links) */
  const syncUrl = useCallback(
    (f: FilterState, s: SortOption) => {
      const next = new URLSearchParams();
      if (term) next.set("q", term);
      if (f.categories.length === 1) next.set("category", f.categories[0]);
      if (f.sellers.length === 1) next.set("seller", f.sellers[0]);
      if (f.organicOnly) next.set("organic", "1");
      if (f.seasonalOnly) next.set("seasonal", "1");
      if (f.onSaleOnly) next.set("onsale", "1");
      if (s !== (f.onSaleOnly ? "discount-desc" : "relevance")) next.set("sort", s);
      const qs = next.toString();
      router.replace(qs ? `/search?${qs}` : "/search", { scroll: false });
    },
    [router, term]
  );

  const handleFilters = useCallback(
    (f: FilterState) => {
      setFilters(f);
      syncUrl(f, sort);
    },
    [sort, syncUrl]
  );

  const handleSort = useCallback(
    (s: SortOption) => {
      setSort(s);
      syncUrl(filters, s);
    },
    [filters, syncUrl]
  );

  const handleCategoryTab = useCallback(
    (slug: string | null) => {
      // "All Products" clears every filter but keeps the search term
      const next: FilterState = slug
        ? { ...filters, categories: [slug] }
        : {
            ...DEFAULT_FILTERS,
            priceRange: [...PRICE_BOUNDS] as [number, number],
          };
      handleFilters(next);
    },
    [filters, handleFilters]
  );

  const resetAll = useCallback(() => {
    const f: FilterState = { ...DEFAULT_FILTERS, priceRange: [...PRICE_BOUNDS] as [number, number] };
    setFilters(f);
    syncUrl(f, sort);
  }, [sort, syncUrl]);

  const activeCategory = filters.categories.length === 1 ? filters.categories[0] : null;

  const heading = useMemo(() => {
    if (term) return `Results for “${term}”`;
    if (activeCategory) {
      return categories.find((category) => category.slug === activeCategory)?.name
        ?? CATEGORY_BY_SLUG[activeCategory]?.name
        ?? CATEGORY_GROUP_BY_ID[activeCategory]?.name
        ?? activeCategory;
    }
    if (filters.organicOnly) return "Certified Organic";
    if (filters.seasonalOnly) return "In Season Now";
    if (filters.onSaleOnly) return "Deals & Offers";
    return "All products";
  }, [term, activeCategory, categories, filters.organicOnly, filters.seasonalOnly, filters.onSaleOnly]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
      <Breadcrumb className="mb-4">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/">Home</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{heading}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-charcoal sm:text-3xl">{heading}</h1>
          <p className="mt-1 text-sm text-graymute">
            {resultCount} {resultCount === 1 ? "product" : "products"} in the store catalogue
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={sort} onValueChange={(v: SortOption) => handleSort(v)}>
            <SelectTrigger className="h-11 w-44 rounded-xl border-forest-100 bg-white/80 text-sm font-semibold" aria-label="Sort products">
              <SelectValue placeholder="Sort" />
            </SelectTrigger>
            <SelectContent className="rounded-xl border-forest-100">
              {SORT_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="hidden overflow-hidden rounded-xl border border-forest-100 bg-white/80 sm:flex" role="group" aria-label="View mode">
            <button
              onClick={() => setView("grid")}
              aria-label="Grid view"
              aria-pressed={view === "grid"}
              className={cn("flex size-11 items-center justify-center transition", view === "grid" ? "bg-forest-900 text-white" : "text-charcoal hover:bg-forest-50")}
            >
              <LayoutGrid className="size-[18px]" aria-hidden />
            </button>
            <button
              onClick={() => setView("list")}
              aria-label="List view"
              aria-pressed={view === "list"}
              className={cn("flex size-11 items-center justify-center transition", view === "list" ? "bg-forest-900 text-white" : "text-charcoal hover:bg-forest-50")}
            >
              <List className="size-[18px]" aria-hidden />
            </button>
          </div>
        </div>
      </div>

      <div className="mb-5">
        <CategoryTabs active={activeCategory} onChange={handleCategoryTab} />
      </div>

      <div className="mb-4 lg:hidden">
        <MobileFiltersTrigger filters={filters} onChange={handleFilters} resultCount={resultCount} />
      </div>

      <div className="flex items-start gap-6">
        <FiltersPanel filters={filters} onChange={handleFilters} resultCount={resultCount} />
        <div className="min-w-0 flex-1">
          {status === "loading" ? (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4" aria-label="Loading products">
              {Array.from({ length: 8 }).map((_, index) => (
                <div key={index} className="shimmer aspect-[3/4] rounded-2xl" />
              ))}
            </div>
          ) : status === "error" ? (
            <div role="alert" className="rounded-2xl border border-red-100 bg-white p-6 text-center">
              <p className="text-sm font-semibold text-charcoal">{error}</p>
              <button
                onClick={reload}
                className="mt-4 inline-flex h-10 items-center gap-2 rounded-xl bg-forest-900 px-4 text-sm font-bold text-white"
              >
                <RefreshCw className="size-4" aria-hidden /> Retry
              </button>
            </div>
          ) : (
            <ProductBrowser
              products={products}
              term={term}
              filters={filters}
              sort={sort}
              view={view}
              onReset={resetAll}
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-7xl space-y-6 px-4 py-10">
          <div className="shimmer h-9 w-64 rounded-xl" />
          <div className="shimmer h-12 w-full rounded-2xl" />
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="shimmer aspect-[3/4] rounded-2xl" />
            ))}
          </div>
        </div>
      }
    >
      <SearchPageInner />
    </Suspense>
  );
}
