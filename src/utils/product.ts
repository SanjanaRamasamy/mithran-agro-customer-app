/* Small shared helpers for product logic. */

import type { Product, ProductVariant } from "@/types";
import { calcDiscountPercent } from "@/utils/format";

export function getLowestVariantPrice(product: Product): ProductVariant {
  return product.variants.reduce((min, v) => (v.price < min.price ? v : min), product.variants[0]);
}

export function getMaxDiscount(product: Product): number {
  return Math.max(...product.variants.map((v) => calcDiscountPercent(v.mrp, v.price)));
}

export function getBestVariant(product: Product): ProductVariant {
  const inStock = product.variants.filter((v) => v.inStock);
  const pool = inStock.length ? inStock : product.variants;
  return pool.reduce((min, v) => (v.price < min.price ? v : min), pool[0]);
}

export function isProductInStock(product: Product): boolean {
  return product.variants.some((v) => v.inStock);
}

export function makeCartItemId(productId: string, variantId: string): string {
  return `${productId}:${variantId}`;
}

export function splitCartItemId(id: string): { productId: string; variantId: string } {
  const [productId, variantId] = id.split(":");
  return { productId, variantId };
}
