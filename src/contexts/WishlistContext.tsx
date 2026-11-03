"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { WishlistEntry } from "@/types";
import { readStorage, writeStorage } from "@/utils/storage";
import { PRODUCT_BY_ID } from "@/data/products";
import { getBestVariant } from "@/utils/product";

const WISHLIST_KEY = "verdant.wishlist.v1";

interface WishlistContextValue {
  entries: WishlistEntry[];
  count: number;
  has: (productId: string) => boolean;
  toggle: (productId: string) => { added: boolean; message: string };
  remove: (productId: string) => void;
  clear: () => void;
  moveToCart: (productId: string) => { ok: boolean; message: string };
}

const WishlistContext = createContext<WishlistContextValue | null>(null);

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const [entries, setEntries] = useState<WishlistEntry[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setEntries(readStorage<WishlistEntry[]>(WISHLIST_KEY, []));
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) writeStorage(WISHLIST_KEY, entries);
  }, [entries, hydrated]);

  const has = useCallback(
    (productId: string) => entries.some((e) => e.productId === productId),
    [entries]
  );

  const toggle = useCallback(
    (productId: string): { added: boolean; message: string } => {
      const product = PRODUCT_BY_ID[productId];
      const name = product?.name ?? "Product";
      let added = false;
      setEntries((prev) => {
        if (prev.some((e) => e.productId === productId)) {
          return prev.filter((e) => e.productId !== productId);
        }
        added = true;
        return [...prev, { productId, addedAt: new Date().toISOString() }];
      });
      return {
        added,
        message: added ? `${name} saved to wishlist` : `${name} removed from wishlist`,
      };
    },
    []
  );

  const remove = useCallback((productId: string) => {
    setEntries((prev) => prev.filter((e) => e.productId !== productId));
  }, []);

  const clear = useCallback(() => setEntries([]), []);

  /** Wishlist → cart uses the best available variant. */
  const moveToCart = useCallback(
    (productId: string): { ok: boolean; message: string } => {
      const product = PRODUCT_BY_ID[productId];
      if (!product) return { ok: false, message: "Product unavailable" };
      const variant = getBestVariant(product);
      if (!variant.inStock) return { ok: false, message: `${product.name} is out of stock` };
      // actual cart insertion is performed by the caller who has both contexts
      return { ok: true, message: `${product.name} (${variant.name}) moved to basket`, };
    },
    []
  );

  const value = useMemo<WishlistContextValue>(
    () => ({
      entries,
      count: entries.length,
      has,
      toggle,
      remove,
      clear,
      moveToCart,
    }),
    [entries, has, toggle, remove, clear, moveToCart]
  );

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
}

export function useWishlist(): WishlistContextValue {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error("useWishlist must be used inside <WishlistProvider>");
  return ctx;
}
