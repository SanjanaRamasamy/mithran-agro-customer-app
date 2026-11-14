"use client";

import { useMemo } from "react";
import type { FilterState, Product, SortOption } from "@/types";
import { getLowestVariantPrice, getMaxDiscount, isProductInStock } from "@/utils/product";
import { CATEGORY_BY_ID, CATEGORY_GROUP_BY_ID, expandCategoryIds } from "@/data/categories";

export const DEFAULT_FILTERS: FilterState = {
  categories: [],
  sellers: [],
  priceRange: [0, 30000],
  minRating: null,
  availability: "all",
  organicOnly: false,
  seasonalOnly: false,
  deliveryEligibleOnly: false,
  onSaleOnly: false,
};

export function matchesFilters(product: Product, f: FilterState): boolean {
  if (f.categories.length) {
    // collections (women/men/kids) and departments expand to leaf categories
    const expanded = expandCategoryIds(f.categories);
    const productCategories = new Set([
      product.categoryId,
      ...(product.prestaShop?.categoryIds ?? []),
      ...(product.prestaShop?.categoryAncestorIds ?? []),
      ...(product.prestaShop?.categorySlugs ?? []),
    ]);
    if (!expanded.some((categoryId) => productCategories.has(categoryId))) return false;
  }
  if (f.sellers.length && !f.sellers.includes(product.sellerId)) return false;
  const price = getLowestVariantPrice(product).price;
  if (price < f.priceRange[0] || price > f.priceRange[1]) return false;
  if (f.minRating !== null && product.rating < f.minRating) return false;
  if (f.availability === "in-stock" && !isProductInStock(product)) return false;
  if (f.organicOnly && !product.isOrganic) return false;
  if (f.seasonalOnly && !product.isSeasonal) return false;
  if (f.deliveryEligibleOnly && !product.deliveryEligible) return false;
  if (f.onSaleOnly && getMaxDiscount(product) <= 0) return false;
  return true;
}

export function sortProducts(products: Product[], sort: SortOption): Product[] {
  const arr = [...products];
  switch (sort) {
    case "price-asc":
      return arr.sort((a, b) => getLowestVariantPrice(a).price - getLowestVariantPrice(b).price);
    case "price-desc":
      return arr.sort((a, b) => getLowestVariantPrice(b).price - getLowestVariantPrice(a).price);
    case "rating-desc":
      return arr.sort((a, b) => b.rating - a.rating);
    case "discount-desc":
      return arr.sort((a, b) => getMaxDiscount(b) - getMaxDiscount(a));
    case "newest":
      return arr.sort(
        (a, b) => new Date(b.harvestDate).getTime() - new Date(a.harvestDate).getTime()
      );
    case "relevance":
    default:
      return arr.sort((a, b) => (b.unitsSold ?? 0) - (a.unitsSold ?? 0));
  }
}

/** Pre-computed category-name index so searches like "saree" or "compost"
 *  match the taxonomy itself, not just product copy. */
const CATEGORY_SEARCH_INDEX: Record<string, string> = Object.fromEntries(
  Object.values(CATEGORY_BY_ID).map((c) => [
    c.id,
    [c.name, c.slug, CATEGORY_GROUP_BY_ID[c.group]?.name ?? ""].join(" ").toLowerCase(),
  ])
);

export function searchProducts(products: Product[], term: string): Product[] {
  const q = term.trim().toLowerCase();
  if (!q) return products;
  const tokens = q.split(/\s+/);
  return products
    .map((p) => {
      let score = 0;
      const name = p.name.toLowerCase();
      const catText = CATEGORY_SEARCH_INDEX[p.categoryId] ?? "";
      const haystack = [
        p.name,
        p.tagline,
        p.description,
        p.origin,
        p.brand ?? "",
        p.fabric ?? "",
        catText,
        ...(p.prestaShop?.categoryNames ?? []),
        ...p.tags,
      ]
        .join(" ")
        .toLowerCase();
      for (const t of tokens) {
        if (name.startsWith(t)) score += 6;
        else if (name.includes(t)) score += 4;
        else if (p.tags.some((tag) => tag.toLowerCase().includes(t))) score += 3;
        else if (catText.includes(t)) score += 2;
        else if (haystack.includes(t)) score += 2;
        else return { p, score: -1 };
      }
      return { p, score };
    })
    .filter((x) => x.score >= 0)
    .sort((a, b) => b.score - a.score)
    .map((x) => x.p);
}

/** Combined search + filter + sort pipeline, memoized. */
export function useProductQuery(
  products: Product[],
  term: string,
  filters: FilterState,
  sort: SortOption
): Product[] {
  return useMemo(() => {
    const searched = searchProducts(products, term);
    const filtered = searched.filter((p) => matchesFilters(p, filters));
    return sortProducts(filtered, sort);
  }, [products, term, filters, sort]);
}
