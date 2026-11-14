"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { RefreshCw } from "lucide-react";
import { useCatalog } from "@/contexts/CatalogContext";
import ProductDetailsContent from "@/components/product/product-details";

export default function ProductPage() {
  const { id } = useParams<{ id: string }>();
  const { products, status, error, reload } = useCatalog();

  if (status === "loading") {
    return (
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-8 lg:grid-cols-2" aria-label="Loading product">
        <div className="shimmer aspect-square rounded-3xl" />
        <div className="space-y-4">
          <div className="shimmer h-8 w-2/3 rounded-xl" />
          <div className="shimmer h-5 w-1/3 rounded-xl" />
          <div className="shimmer h-48 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div role="alert" className="mx-auto max-w-3xl px-4 py-16 text-center">
        <p className="text-sm font-semibold text-charcoal">{error}</p>
        <button onClick={reload} className="mt-4 inline-flex h-10 items-center gap-2 rounded-xl bg-forest-900 px-4 text-sm font-bold text-white">
          <RefreshCw className="size-4" aria-hidden /> Retry
        </button>
      </div>
    );
  }

  const product = products.find((candidate) => candidate.slug === id || candidate.id === id);
  if (!product) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <h1 className="text-xl font-bold text-charcoal">Product not found</h1>
        <Link href="/search" className="mt-3 inline-block text-sm font-bold text-forest-800 hover:underline">
          Browse products
        </Link>
      </div>
    );
  }

  return <ProductDetailsContent product={product} />;
}
