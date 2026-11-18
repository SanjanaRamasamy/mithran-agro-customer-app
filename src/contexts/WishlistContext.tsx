"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { WishlistEntry } from "@/types";
import { readStorage, removeStorage, writeStorage } from "@/utils/storage";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/NotificationContext";
import { mergeCustomerWishlist, parseCustomerWishlist } from "@/utils/customer-sync";
import { useCatalog } from "@/contexts/CatalogContext";
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
  const { products } = useCatalog();
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const productsById = useMemo(
    () => Object.fromEntries(products.map((product) => [product.id, product])),
    [products]
  );
  const [entries, setEntries] = useState<WishlistEntry[]>([]);
  const [storageOwner, setStorageOwner] = useState<string | null | undefined>(undefined);
  const persistenceQueue = useRef<Promise<void>>(Promise.resolve());
  const currentUserId = useRef<string | null>(user?.id ?? null);
  const hasCurrentStorage = storageOwner === (user?.id ?? null);
  const visibleEntries = hasCurrentStorage ? entries : [];

  useEffect(() => {
    currentUserId.current = user?.id ?? null;
  }, [user?.id]);

  useEffect(() => {
    if (authLoading) return;
    let cancelled = false;
    const customerId = user?.id ?? null;
    setStorageOwner(undefined);

    if (!customerId) {
      setEntries(readStorage<WishlistEntry[]>(WISHLIST_KEY, []));
      setStorageOwner(null);
      return () => {
        cancelled = true;
      };
    }

    const loadCustomerWishlist = async () => {
      try {
        const response = await fetch("/api/customer/wishlist", { cache: "no-store" });
        const payload: unknown = await response.json();
        if (
          !response.ok ||
          typeof payload !== "object" ||
          payload === null ||
          !("entries" in payload)
        ) {
          throw new Error("Unable to load your saved wishlist.");
        }
        const remoteEntries = parseCustomerWishlist(payload.entries);
        if (!remoteEntries) throw new Error("Your saved wishlist could not be read.");

        const guestRaw: unknown = readStorage<unknown>(WISHLIST_KEY, []);
        const guestEntries = parseCustomerWishlist(guestRaw);
        let nextEntries = remoteEntries;
        if (guestEntries && guestEntries.length > 0) {
          const merged = mergeCustomerWishlist(remoteEntries, guestEntries);
          const saveResponse = await fetch("/api/customer/wishlist", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            cache: "no-store",
            body: JSON.stringify({ entries: merged }),
          });
          const savePayload: unknown = await saveResponse.json();
          const savedEntries =
            typeof savePayload === "object" &&
            savePayload !== null &&
            "entries" in savePayload
              ? parseCustomerWishlist(savePayload.entries)
              : null;
          if (!saveResponse.ok || !savedEntries) {
            toast({
              kind: "error",
              title: "Your guest wishlist could not be merged. It remains saved in this browser.",
            });
          } else {
            nextEntries = savedEntries;
            removeStorage(WISHLIST_KEY);
          }
        } else if (guestEntries === null) {
          toast({
            kind: "error",
            title: "Your guest wishlist could not be synced. It remains saved in this browser.",
          });
        }

        if (!cancelled) {
          setEntries(nextEntries);
          setStorageOwner(customerId);
        }
      } catch {
        if (!cancelled) {
          toast({
            kind: "error",
            title: "Your saved wishlist could not be loaded from your account.",
          });
        }
      }
    };
    void loadCustomerWishlist();
    return () => {
      cancelled = true;
    };
  }, [authLoading, user?.id, toast]);

  useEffect(() => {
    if (storageOwner === null && !user) writeStorage(WISHLIST_KEY, entries);
    if (storageOwner && storageOwner === user?.id) {
      const ownerId = storageOwner;
      const snapshot = JSON.stringify({ entries });
      persistenceQueue.current = persistenceQueue.current
        .catch(() => undefined)
        .then(async () => {
          if (currentUserId.current !== ownerId) return;
          const response = await fetch("/api/customer/wishlist", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            cache: "no-store",
            body: snapshot,
          });
          if (!response.ok) throw new Error("Wishlist synchronization failed.");
        })
        .catch(() => {
          if (currentUserId.current === ownerId) {
            toast({
              kind: "error",
              title: "Your wishlist changes could not be synced to your account.",
            });
          }
        });
    }
  }, [entries, storageOwner, user?.id, toast]);

  const has = useCallback(
    (productId: string) => visibleEntries.some((e) => e.productId === productId),
    [visibleEntries]
  );

  const toggle = useCallback(
    (productId: string): { added: boolean; message: string } => {
      if (!hasCurrentStorage) {
        return { added: false, message: "Your wishlist is still loading." };
      }
      const product = productsById[productId];
      const name = product?.name ?? "Product";
      const added = !visibleEntries.some((entry) => entry.productId === productId);
      setEntries((prev) => added
        ? [...prev, { productId, addedAt: new Date().toISOString() }]
        : prev.filter((entry) => entry.productId !== productId));
      return {
        added,
        message: added ? `${name} saved to wishlist` : `${name} removed from wishlist`,
      };
    },
    [hasCurrentStorage, visibleEntries, productsById]
  );

  const remove = useCallback((productId: string) => {
    if (!hasCurrentStorage) return;
    setEntries((prev) => prev.filter((e) => e.productId !== productId));
  }, [hasCurrentStorage]);

  const clear = useCallback(() => {
    if (!hasCurrentStorage) return;
    setEntries([]);
  }, [hasCurrentStorage]);

  /** Wishlist → cart uses the best available variant. */
  const moveToCart = useCallback(
    (productId: string): { ok: boolean; message: string } => {
      const product = productsById[productId];
      if (!product) return { ok: false, message: "Product unavailable" };
      const variant = getBestVariant(product);
      if (!variant.inStock) return { ok: false, message: `${product.name} is out of stock` };
      // actual cart insertion is performed by the caller who has both contexts
      return { ok: true, message: `${product.name} (${variant.name}) moved to basket`, };
    },
    [productsById]
  );

  const value = useMemo<WishlistContextValue>(
    () => ({
      entries: visibleEntries,
      count: visibleEntries.length,
      has,
      toggle,
      remove,
      clear,
      moveToCart,
    }),
    [visibleEntries, has, toggle, remove, clear, moveToCart]
  );

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
}

export function useWishlist(): WishlistContextValue {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error("useWishlist must be used inside <WishlistProvider>");
  return ctx;
}
