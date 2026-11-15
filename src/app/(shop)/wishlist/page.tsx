"use client";

import { useMemo } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Heart, ShoppingBasket, Trash2 } from "lucide-react";
import { useWishlist } from "@/contexts/WishlistContext";
import { useShoppingActions } from "@/hooks/useShoppingActions";
import { useCatalog } from "@/contexts/CatalogContext";
import { ProductCard } from "@/components/product/product-card";
import { EmptyState } from "@/components/ui/empty-state";
import { timeAgo } from "@/utils/format";
import { ProtectedRoute } from "@/components/auth/protected-route";

export default function WishlistPage() {
  const wishlist = useWishlist();
  const { products: catalogProducts, status } = useCatalog();
  const { moveWishlistItemToCart } = useShoppingActions();

  const products = useMemo(
    () =>
      wishlist.entries
        .map((e) => ({ entry: e, product: catalogProducts.find((product) => product.id === e.productId) }))
        .filter((x): x is { entry: (typeof wishlist.entries)[number]; product: NonNullable<typeof x.product> } => Boolean(x.product)),
    [wishlist.entries, catalogProducts]
  );

  const addAllToCart = () => {
    for (const { product } of products) {
      moveWishlistItemToCart(product.id);
    }
  };

  return (
    <ProtectedRoute>
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <nav aria-label="Breadcrumb" className="text-xs text-graymute">
        <ol className="flex items-center gap-1.5">
          <li><Link href="/" className="hover:text-forest-800">Home</Link></li>
          <li aria-hidden>/</li>
          <li className="font-semibold text-charcoal">Wishlist</li>
        </ol>
      </nav>
      <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-charcoal sm:text-3xl">My wishlist</h1>
          <p className="mt-1 text-sm text-graymute">
            {products.length > 0
              ? `${products.length} saved ${products.length === 1 ? "item" : "items"} — synced locally in this demo`
              : "Save produce you love and find it here"}
          </p>
        </div>
        {products.length > 0 && (
          <button
            onClick={addAllToCart}
            className="inline-flex h-11 items-center gap-2 rounded-xl bg-forest-900 px-5 text-sm font-bold text-white shadow-soft transition hover:bg-forest-800 active:scale-95"
          >
            <ShoppingBasket className="size-4" aria-hidden />
            Add all in-stock to basket
          </button>
        )}
      </div>

      {products.length === 0 ? (
        status === "loading" ? (
          <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4" aria-label="Loading wishlist">
            {Array.from({ length: 4 }).map((_, index) => <div key={index} className="shimmer aspect-[3/4] rounded-2xl" />)}
          </div>
        ) : <EmptyState
          icon={Heart}
          title="Nothing saved yet"
          description="Save a product from the store catalogue to keep it here for later."
          action={{ label: "Discover produce", href: "/search" }}
          className="mt-8"
        />
      ) : (
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4" role="list">
          {products.map(({ entry, product }) => (
            <motion.div key={product.id} layout role="listitem" className="relative">
              <ProductCard product={product} />
              <div className="mt-1.5 flex items-center justify-between px-1">
                <span className="text-[10px] text-graymute">saved {timeAgo(entry.addedAt)}</span>
                <div className="flex gap-1">
                  <button
                    onClick={() => moveWishlistItemToCart(product.id)}
                    className="inline-flex items-center gap-1 rounded-lg bg-forest-50 px-2 py-1 text-[11px] font-bold text-forest-800 transition hover:bg-forest-100"
                    aria-label={`Move ${product.name} to basket`}
                  >
                    <ShoppingBasket className="size-3" aria-hidden />
                    To basket
                  </button>
                  <button
                    onClick={() => wishlist.remove(product.id)}
                    className="rounded-lg p-1.5 text-graymute transition hover:bg-red-50 hover:text-red-600"
                    aria-label={`Remove ${product.name} from wishlist`}
                  >
                    <Trash2 className="size-3.5" aria-hidden />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
    </ProtectedRoute>
  );
}
