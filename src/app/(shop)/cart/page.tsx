"use client";

import { motion } from "framer-motion";
import { CartBySeller, EmptyCartState, SavedForLater } from "@/components/cart/cart-lines";
import { OrderSummary } from "@/components/cart/order-summary";
import { useCart } from "@/contexts/CartContext";

export default function CartPage() {
  const { lines, itemCount } = useCart();

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <h1 className="text-2xl font-extrabold tracking-tight text-charcoal sm:text-3xl">Your basket</h1>
      <p className="mt-1 text-sm text-graymute">
        {itemCount > 0
          ? `${itemCount} ${itemCount === 1 ? "item" : "items"} · grouped by farm for packing`
          : "Fresh produce from certified farms, one tap away"}
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
              <CartBySeller lines={lines} />
              <SavedForLater />
            </div>
          )}
        </div>
        <aside aria-label="Order summary" className="lg:sticky lg:top-40 lg:self-start">
          <OrderSummary ctaHref="/checkout" disabled={lines.length === 0} sticky={false} />
        </aside>
      </motion.div>
    </div>
  );
}
