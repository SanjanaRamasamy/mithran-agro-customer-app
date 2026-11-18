"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Grid3X3, RefreshCw, Sparkles } from "lucide-react";
import type { FilterState, Product, SortOption } from "@/types";
import {
  CATEGORY_BY_ID,
  CATEGORY_BY_SLUG,
  CATEGORY_GROUP_BY_ID,
} from "@/data/categories";
import { useCatalog } from "@/contexts/CatalogContext";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FiltersPanel } from "@/components/product/filters-panel";
import { ProductBrowser } from "@/components/product/product-browser";
import { MobileFiltersTrigger } from "@/components/product/mobile-filters-trigger";
import { SmartImage } from "@/components/ui/smart-image";
import { Rating } from "@/components/ui/rating";
import { Price } from "@/components/ui/price";
import { SORT_OPTIONS, PRICE_BOUNDS } from "@/constants";
import { DEFAULT_FILTERS, matchesFilters } from "@/hooks/useProductQuery";
import { getLowestVariantPrice } from "@/utils/product";
import { cn } from "@/lib/utils";

interface CategoryLandingProps {
  slug: string;
}

/**
 * Full landing page for any department, collection or leaf category:
 * banner, subcategory grid, featured strip, filters and sorting.
 */
export function CategoryLanding({ slug }: CategoryLandingProps) {
  const { products, categories, categoriesError, status, error, reload } = useCatalog();
  const cat = CATEGORY_BY_ID[slug];
  const group = CATEGORY_GROUP_BY_ID[slug];
  const liveCategory = categories.find((category) => category.slug === slug);

  const dept = cat ? CATEGORY_GROUP_BY_ID[cat.group] : group;
  const name = liveCategory?.name ?? cat?.name ?? group?.name ?? "Shop";
  const description = liveCategory?.description ?? "";
  const banner = cat?.image ?? group?.image ?? "";

  /* which category ids does this page cover? */
  const scopeIds = useMemo(() => {
    if (!liveCategory) return new Set<string>();
    const ids = new Set<string>();
    const visit = (categoryId: string) => {
      if (ids.has(categoryId)) return;
      ids.add(categoryId);
      for (const child of categories.filter((candidate) => candidate.parentId === categoryId)) {
        visit(child.id);
      }
    };
    visit(liveCategory.id);
    return ids;
  }, [liveCategory, categories]);

  const scopeProducts = useMemo(
    () => products.filter((product) =>
      product.prestaShop?.categoryIds.some((categoryId) => scopeIds.has(categoryId)) ||
      product.prestaShop?.categoryAncestorIds.some((categoryId) => scopeIds.has(categoryId))
    ),
    [products, scopeIds]
  );

  const subcats = useMemo(() => {
    if (!liveCategory) return [];
    const children = categories.filter(
      (candidate) => candidate.active && candidate.parentId === liveCategory.id
    );
    return (children.length
      ? children
      : categories.filter(
          (candidate) => candidate.active && candidate.parentId === liveCategory.parentId && candidate.id !== liveCategory.id
        )
    ).sort((left, right) => left.name.localeCompare(right.name));
  }, [liveCategory, categories]);

  const activeCategoryFilter = liveCategory?.id ?? slug;

  const [filters, setFilters] = useState<FilterState>(() => ({
    ...DEFAULT_FILTERS,
    categories: activeCategoryFilter ? [activeCategoryFilter] : [],
    priceRange: [...PRICE_BOUNDS] as [number, number],
  }));
  const [sort, setSort] = useState<SortOption>("relevance");

  useEffect(() => {
    setFilters((current) => ({ ...current, categories: [activeCategoryFilter] }));
  }, [activeCategoryFilter]);

  const featured = useMemo(
    () => [...scopeProducts].slice(0, 4),
    [scopeProducts]
  );

  const resultCount = useMemo(
    () => scopeProducts.filter((p) => matchesFilters(p, filters)).length,
    [scopeProducts, filters]
  );

  const parentGroup = dept;
  const isDeptPage = Boolean(group) && !cat;
  const isCollectionPage = categories.some((category) => category.parentId === liveCategory?.id);

  if (categoriesError) {
    return (
      <div role="alert" className="mx-auto max-w-3xl px-4 py-16 text-center">
        <h1 className="text-xl font-bold text-charcoal">Categories are temporarily unavailable</h1>
        <p className="mt-2 text-sm text-graymute">{categoriesError}</p>
        <button onClick={reload} className="mt-4 inline-flex h-10 items-center rounded-xl bg-forest-900 px-4 text-sm font-bold text-white">
          Retry
        </button>
      </div>
    );
  }

  if (status === "ready" && !liveCategory && !cat && !group) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <h1 className="text-xl font-bold text-charcoal">Category not found</h1>
        <p className="mt-2 text-sm text-graymute">We could not find this category in the store catalogue.</p>
        <Link href="/search" className="mt-4 inline-flex h-10 items-center rounded-xl bg-forest-900 px-4 text-sm font-bold text-white">
          Browse all products
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
      <Breadcrumb className="mb-4">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/">Home</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          {parentGroup && !isDeptPage && (
            <>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link href={`/category/${parentGroup.slug}`}>{parentGroup.name}</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
            </>
          )}
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{name}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* ------------------------------ banner ------------------------------ */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        aria-label={`${name} banner`}
        className="relative overflow-hidden rounded-3xl"
      >
        <div className="relative h-44 w-full sm:h-56 lg:h-64">
          {banner ? (
            <Image
              src={banner}
              alt=""
              fill
              priority
              sizes="(max-width: 1280px) 100vw, 1280px"
              className="object-cover"
            />
          ) : (
            <div className="size-full bg-gradient-to-br from-forest-800 via-forest-700 to-emerald-600" />
          )}
          <div className="absolute inset-0 bg-gradient-to-r from-forest-950/80 via-forest-950/45 to-transparent" />
          <div className="absolute inset-0 flex flex-col justify-end p-6 sm:p-10">
            <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
              {name}
            </h1>
            {description && (
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-forest-50/90 sm:text-[15px]">
                {description}
              </p>
            )}
            <p className="mt-3 text-xs font-semibold text-white/80">
              {scopeProducts.length} {scopeProducts.length === 1 ? "product" : "products"} ·{" "}
                  {subcats.length > 0
                ? subcats.some((subcat) => subcat.parentId === liveCategory?.id)
                  ? `${subcats.length} ${subcats.length === 1 ? "subcategory" : "subcategories"}`
                  : `${subcats.length} ${subcats.length === 1 ? "related category" : "related categories"}`
                : "store categories"}
            </p>
          </div>
        </div>
      </motion.section>

      {/* --------------------------- subcategory grid --------------------------- */}
      {subcats.length > 0 && (
        <section aria-label={`Shop ${name} subcategories`} className="mt-8">
          <div className="mb-4 flex items-end justify-between gap-3">
            <h2 className="text-lg font-extrabold tracking-tight text-charcoal sm:text-xl">
              {isCollectionPage ? `Shop all ${name}` : isDeptPage ? "Shop by category" : "More in this department"}
            </h2>
            <Link
              href="/search"
              className="hidden text-sm font-bold text-forest-800 transition hover:text-forest-600 sm:block"
            >
              Browse everything →
            </Link>
          </div>
          <div className="no-scrollbar -mx-4 flex gap-3 overflow-x-auto px-4 pb-2 sm:mx-0 sm:grid sm:grid-cols-3 sm:overflow-visible sm:px-0 lg:grid-cols-4 xl:grid-cols-6">
            {subcats.slice(0, 12).map((sub, i) => {
              const SubIcon = CATEGORY_BY_SLUG[sub.slug]?.icon ?? Grid3X3;
              const subCount = products.filter((product) =>
                product.prestaShop?.categoryAncestorIds.includes(sub.id)
              ).length;
              return (
                <motion.div
                  key={sub.id}
                  initial={{ opacity: 0, y: 14 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-40px" }}
                  transition={{ duration: 0.3, delay: Math.min(i * 0.04, 0.3) }}
                  className="w-40 shrink-0 sm:w-auto"
                >
                  <Link
                    href={`/category/${sub.slug}`}
                    className="group flex h-full flex-col items-center gap-2 rounded-2xl border border-forest-50 bg-white p-4 text-center shadow-soft transition hover:-translate-y-0.5 hover:shadow-lift"
                  >
                    <span className="flex size-12 items-center justify-center rounded-2xl bg-forest-50 text-forest-800 transition group-hover:bg-forest-100">
                      <SubIcon className="size-5" aria-hidden />
                    </span>
                    <span className="text-sm font-bold leading-tight text-charcoal group-hover:text-forest-800">
                      {sub.name}
                    </span>
                    <span className="text-[11px] font-semibold text-graymute">
                      {subCount} products
                    </span>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </section>
      )}

      {/* ---------------------------- featured strip ---------------------------- */}
      {featured.length > 0 && (
        <section aria-label={`Products in ${name}`} className="mt-10">
          <div className="mb-4 flex items-center gap-2">
            <Sparkles className="size-4 text-forest-700" aria-hidden />
            <h2 className="text-lg font-extrabold tracking-tight text-charcoal sm:text-xl">
              Products in {name}
            </h2>
          </div>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {featured.map((p, i) => (
              <FeaturedMiniCard key={p.id} product={p} priority={i < 2} />
            ))}
          </div>
        </section>
      )}

      {/* ------------------------------ browser ------------------------------ */}
      <section aria-label={`All ${name} products`} className="mt-10">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-xl font-extrabold tracking-tight text-charcoal sm:text-2xl">
              All {name}
            </h2>
            <p className="mt-1 text-sm text-graymute">
              {resultCount} {resultCount === 1 ? "product" : "products"}
            </p>
          </div>
          <Select value={sort} onValueChange={(v: SortOption) => setSort(v)}>
            <SelectTrigger
              className="h-11 w-44 rounded-xl border-forest-100 bg-white/80 text-sm font-semibold"
              aria-label="Sort products"
            >
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
        </div>

        {/* quick switch chips between sibling categories */}
        {subcats.length > 0 && (
          <div className="no-scrollbar mb-4 flex gap-2 overflow-x-auto pb-1">
            <button
              onClick={() => setFilters((f) => ({ ...f, categories: [activeCategoryFilter] }))}
              className={cn(
                "shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-bold transition",
                filters.categories.length === 1 && filters.categories[0] === activeCategoryFilter
                  ? "border-forest-900 bg-forest-900 text-white"
                  : "border-forest-100 bg-white/80 text-charcoal hover:border-forest-300"
              )}
            >
              All {name}
            </button>
            {subcats.map((sub) => (
              <button
                key={sub.id}
                onClick={() => setFilters((f) => ({ ...f, categories: [sub.id] }))}
                className={cn(
                  "shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-bold transition",
                  filters.categories.length === 1 && filters.categories[0] === sub.id
                    ? "border-forest-900 bg-forest-900 text-white"
                    : "border-forest-100 bg-white/80 text-charcoal hover:border-forest-300"
                )}
              >
                {sub.name}
              </button>
            ))}
          </div>
        )}

        <div className="mb-4 lg:hidden">
          <MobileFiltersTrigger filters={filters} onChange={setFilters} resultCount={resultCount} />
        </div>

        <div className="flex items-start gap-6">
          <FiltersPanel filters={filters} onChange={setFilters} resultCount={resultCount} />
          <div className="min-w-0 flex-1">
            {status === "loading" ? (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4" aria-label="Loading products">
                {Array.from({ length: 8 }).map((_, index) => <div key={index} className="shimmer aspect-[3/4] rounded-2xl" />)}
              </div>
            ) : status === "error" ? (
              <div role="alert" className="rounded-2xl border border-red-100 bg-white p-6 text-center">
                <p className="text-sm font-semibold text-charcoal">{error}</p>
                <button onClick={reload} className="mt-4 inline-flex h-10 items-center gap-2 rounded-xl bg-forest-900 px-4 text-sm font-bold text-white">
                  <RefreshCw className="size-4" aria-hidden /> Retry
                </button>
              </div>
            ) : (
              <ProductBrowser
                products={scopeProducts}
                term=""
                filters={filters}
                sort={sort}
                onReset={() => setFilters({
                  ...DEFAULT_FILTERS,
                  categories: activeCategoryFilter ? [activeCategoryFilter] : [],
                  priceRange: [...PRICE_BOUNDS] as [number, number],
                })}
              />
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

function FeaturedMiniCard({ product, priority }: { product: Product; priority?: boolean }) {
  const cheapest = getLowestVariantPrice(product);
  return (
    <Link
      href={`/products/${product.slug}`}
      className="group block overflow-hidden rounded-2xl border border-forest-50 bg-white shadow-soft transition-shadow hover:shadow-lift"
    >
      <div className="relative">
        <SmartImage
          src={product.images[0]}
          alt={product.name}
          emojiSeed={product.name}
          rounded="rounded-none"
          className="aspect-[4/3] w-full transition-transform duration-500 group-hover:scale-[1.04]"
          sizes="(max-width: 1024px) 50vw, 25vw"
          priority={priority}
        />
        {product.reviewCount > 0 && (
          <Rating value={product.rating} count={product.reviewCount} className="absolute bottom-2 left-2 rounded-full bg-white/85 px-2 py-0.5" />
        )}
      </div>
      <div className="p-3.5">
        <p className="line-clamp-1 text-sm font-bold text-charcoal group-hover:text-forest-800">
          {product.name}
        </p>
        {product.tagline && <p className="mt-0.5 line-clamp-1 text-xs text-graymute">{product.tagline}</p>}
        <Price price={cheapest.price} mrp={cheapest.mrp} size="sm" className="mt-2" />
      </div>
    </Link>
  );
}
