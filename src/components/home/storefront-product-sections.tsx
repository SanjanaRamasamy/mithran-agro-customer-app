"use client";

import Link from "next/link";
import { RefreshCw } from "lucide-react";
import { useCatalog } from "@/contexts/CatalogContext";
import { ProductRail } from "@/components/home/product-rail";
import { SectionHeading } from "@/components/ui/section-heading";

export function StorefrontProductSections() {
  const { products, categories, status, error, reload } = useCatalog();

  if (status === "loading") {
    return (
      <section aria-label="Loading products" className="space-y-4">
        <div className="shimmer h-8 w-56 rounded-xl" />
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="shimmer aspect-[3/4] rounded-2xl" />
          ))}
        </div>
      </section>
    );
  }

  if (status === "error") {
    return (
      <section role="alert" className="rounded-2xl border border-red-100 bg-white p-6 text-center">
        <p className="text-sm font-semibold text-charcoal">{error}</p>
        <button
          onClick={reload}
          className="mt-4 inline-flex h-10 items-center gap-2 rounded-xl bg-forest-900 px-4 text-sm font-bold text-white"
        >
          <RefreshCw className="size-4" aria-hidden /> Retry
        </button>
      </section>
    );
  }

  if (products.length === 0) {
    return (
      <section className="rounded-2xl border border-forest-100 bg-white px-6 py-10 text-center">
        <h2 className="text-lg font-bold text-charcoal">No active products yet</h2>
        <p className="mt-1 text-sm text-graymute">Products will appear here when they are active in the store.</p>
        <Link href="/search" className="mt-4 inline-block text-sm font-bold text-forest-800 hover:underline">
          Browse catalogue
        </Link>
      </section>
    );
  }

  const leafCategories = categories.filter(
    (category) =>
      category.active &&
      category.level >= 2 &&
      !categories.some((child) => child.parentId === category.id) &&
      products.some((product) => product.prestaShop?.categoryIds.includes(category.id))
  );

  return (
    <div className="space-y-12">
      <section aria-label="Products from the store">
        <SectionHeading title="From our catalogue" viewAllHref="/search" viewAllLabel="All products" />
        <ProductRail products={products.slice(0, 12)} priority />
      </section>
      {leafCategories.map((category) => {
        const categoryProducts = products.filter((product) =>
          product.prestaShop?.categoryIds.includes(category.id)
        );
        if (categoryProducts.length === 0) return null;
        return (
          <section key={category.id} aria-label={category.name}>
            <SectionHeading
              title={category.name}
              viewAllHref={`/category/${category.slug}`}
            />
            <ProductRail products={categoryProducts.slice(0, 12)} />
          </section>
        );
      })}
    </div>
  );
}