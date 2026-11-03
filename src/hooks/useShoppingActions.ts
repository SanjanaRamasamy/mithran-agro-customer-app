"use client";

import { useCallback } from "react";
import { useCart } from "@/contexts/CartContext";
import { useWishlist } from "@/contexts/WishlistContext";
import { useToast } from "@/contexts/NotificationContext";
import { PRODUCT_BY_ID } from "@/data/products";
import { getBestVariant } from "@/utils/product";

/**
 * One-click commerce actions shared by cards, drawers and detail pages.
 * Keeps every "add to cart" / "wishlist" interaction consistent.
 */
export function useShoppingActions() {
  const cart = useCart();
  const wishlist = useWishlist();
  const { toast } = useToast();

  const addToCart = useCallback(
    (productId: string, variantId?: string, quantity = 1, opts?: { silent?: boolean }) => {
      const product = PRODUCT_BY_ID[productId];
      if (!product) return;
      const vid = variantId ?? getBestVariant(product).id;
      const result = cart.addItem(productId, vid, quantity);
      if (result.ok) {
        if (!opts?.silent) {
          cart.openDrawer();
          toast({ title: result.message, description: "Simulated action — no real order was placed." });
        }
      } else {
        toast({ kind: "error", title: result.message });
      }
    },
    [cart, toast]
  );

  const toggleWishlist = useCallback(
    (productId: string) => {
      const result = wishlist.toggle(productId);
      toast({
        kind: result.added ? "success" : "info",
        title: result.message,
        description: result.added ? "Simulated — wishlist is local to this demo." : undefined,
      });
    },
    [wishlist, toast]
  );

  const moveWishlistItemToCart = useCallback(
    (productId: string) => {
      const product = PRODUCT_BY_ID[productId];
      if (!product) return;
      const variant = getBestVariant(product);
      if (!variant.inStock) {
        toast({ kind: "warning", title: `${product.name} is out of stock right now` });
        return;
      }
      const res = cart.addItem(productId, variant.id, 1);
      if (res.ok) {
        wishlist.remove(productId);
        toast({ title: `${product.name} moved to basket`, description: "Simulated cart action." });
      } else {
        toast({ kind: "error", title: res.message });
      }
    },
    [cart, wishlist, toast]
  );

  return { addToCart, toggleWishlist, moveWishlistItemToCart };
}
