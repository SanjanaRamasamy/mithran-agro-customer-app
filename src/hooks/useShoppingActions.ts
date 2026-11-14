"use client";

import { useCallback } from "react";
import { useCart } from "@/contexts/CartContext";
import { useWishlist } from "@/contexts/WishlistContext";
import { useToast } from "@/contexts/NotificationContext";
import { useCatalog } from "@/contexts/CatalogContext";
import { getBestVariant } from "@/utils/product";

/**
 * One-click commerce actions shared by cards, drawers and detail pages.
 * Keeps every "add to cart" / "wishlist" interaction consistent.
 */
export function useShoppingActions() {
  const cart = useCart();
  const { products } = useCatalog();
  const wishlist = useWishlist();
  const { toast } = useToast();

  const addToCart = useCallback(
    (productId: string, variantId?: string, quantity = 1, opts?: { silent?: boolean }) => {
      const product = products.find((candidate) => candidate.id === productId);
      if (!product) return;
      const vid = variantId ?? getBestVariant(product).id;
      const requestedQuantity = product.prestaShop
        ? Math.max(quantity, product.prestaShop.minimumQuantity)
        : quantity;
      const result = cart.addItem(productId, vid, requestedQuantity);
      if (result.ok) {
        if (!opts?.silent) {
          cart.openDrawer();
          toast({ title: result.message });
        }
      } else {
        toast({ kind: "error", title: result.message });
      }
    },
    [cart, products, toast]
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
      const product = products.find((candidate) => candidate.id === productId);
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
    [cart, wishlist, products, toast]
  );

  return { addToCart, toggleWishlist, moveWishlistItemToCart };
}
