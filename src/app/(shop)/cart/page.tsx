"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { CartBySeller, EmptyCartState, SavedForLater } from "@/components/cart/cart-lines";
import { OrderSummary } from "@/components/cart/order-summary";
import { useCart } from "@/contexts/CartContext";

export default function CartPage() {
  const { lines, itemCount } = useCart();
  const hasUnavailableItems = lines.some((line) => !line.variant.inStock);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <h1 className="text-2xl font-extrabold tracking-tight text-charcoal sm:text-3xl">Your basket</h1>
      <p className="mt-1 text-sm text-graymute">
        {itemCount > 0
          ? `${itemCount} ${itemCount === 1 ? "item" : "items"} in your basket`
          : "Your store basket is empty"}
      </p>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="mt-6 grid gap-8 lg:grid-cols-[1fr_380px]"
      >
        <div>
          {lines.length === 0 ? (
            <EmptyCartState />
          ) : (
            <div>
              {hasUnavailableItems && (
                <p role="alert" className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-charcoal">
                  Remove or save unavailable items before checkout.
                </p>
              )}
              <CartBySeller lines={lines} />
              <SavedForLater />
            </div>
          )}
        </div>
        <aside aria-label="Order summary" className="lg:sticky lg:top-40 lg:self-start">
          <OrderSummary ctaHref="/checkout" disabled={lines.length === 0 || hasUnavailableItems} sticky={false} />
        </aside>
      </motion.div>
    </div>
  );
}
