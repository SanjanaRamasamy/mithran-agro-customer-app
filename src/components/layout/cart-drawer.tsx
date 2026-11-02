"use client";

import { useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Minus, Plus, ShoppingBasket, Trash2 } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { formatPrice } from "@/utils/format";
import { SmartImage } from "@/components/ui/smart-image";
import { QuantityStepper } from "@/components/ui/quantity-stepper";
import { FREE_DELIVERY_THRESHOLD } from "@/constants";
import { cn } from "@/lib/utils";

/** Animated glass side-drawer showing a compact basket. */
export function CartDrawer() {
  const { isDrawerOpen, closeDrawer, lines, totals, updateQuantity, removeItem, itemCount } = useCart();

  const remaining = Math.max(0, FREE_DELIVERY_THRESHOLD - totals.subtotal);
  const progress = Math.min(100, (totals.subtotal / FREE_DELIVERY_THRESHOLD) * 100);

  return (
    <AnimatePresence>
      {isDrawerOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-forest-950/25 backdrop-blur-[2px]"
            onClick={closeDrawer}
            aria-hidden
          />
          <motion.aside
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 340, damping: 34 }}
            className="glass-strong fixed inset-y-0 right-0 z-[61] flex w-[400px] max-w-[92vw] flex-col rounded-l-3xl"
            role="dialog"
            aria-label="Your basket"
          >
            <div className="flex items-center justify-between border-b border-forest-50 px-5 py-4">
              <h2 className="flex items-center gap-2 text-base font-bold text-charcoal">
                <ShoppingBasket className="size-5 text-forest-800" aria-hidden />
                Your basket
                <span className="rounded-full bg-forest-50 px-2 py-0.5 text-xs font-bold text-forest-800">
                  {itemCount}
                </span>
              </h2>
              <button
                onClick={closeDrawer}
                className="flex size-9 items-center justify-center rounded-xl text-graymute transition hover:bg-soft hover:text-charcoal"
                aria-label="Close basket"
              >
                <ArrowRight className="size-5" aria-hidden />
              </button>
            </div>

            {lines.length === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
                <span className="text-5xl" aria-hidden>🧺</span>
                <p className="text-sm font-semibold text-charcoal">Your basket is empty</p>
                <p className="text-xs leading-relaxed text-graymute">
                  Add farm-fresh produce and it will appear here instantly.
                </p>
                <button
                  onClick={closeDrawer}
                  className="mt-2 inline-flex h-10 items-center rounded-xl bg-forest-900 px-5 text-sm font-semibold text-white transition hover:bg-forest-800"
                >
                  Continue shopping
                </button>
              </div>
            ) : (
              <>
                {/* free delivery progress */}
                <div className="border-b border-forest-50 px-5 py-3">
                  {remaining > 0 ? (
                    <p className="text-xs text-graymute">
                      Add <strong className="text-forest-800">{formatPrice(remaining)}</strong> more for free delivery
                    </p>
                  ) : (
                    <p className="text-xs font-semibold text-success">🎉 You&apos;ve unlocked free delivery!</p>
                  )}
                  <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-soft">
                    <motion.div
                      className="h-full rounded-full bg-gradient-to-r from-forest-600 to-lime-natural"
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                      transition={{ duration: 0.5, ease: "easeOut" }}
                    />
                  </div>
                </div>

                <ul className="flex-1 divide-y divide-forest-50/70 overflow-y-auto px-5">
                  {lines.map((line) => (
                    <li key={line.id} className="flex gap-3 py-4">
                      <SmartImage
                        src={line.product.images[0]}
                        alt={line.product.name}
                        emojiSeed={line.product.name}
                        rounded="rounded-xl"
                        className="size-16 shrink-0"
                        sizes="64px"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-charcoal">{line.product.name}</p>
                        <p className="mt-0.5 text-xs text-graymute">{line.variant.name}</p>
                        <div className="mt-2 flex items-center justify-between">
                          <QuantityStepper
                            value={line.quantity}
                            size="sm"
                            min={0}
                            onChange={(q) => updateQuantity(line.id, q)}
                            ariaLabel={`Quantity of ${line.product.name}`}
                          />
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-charcoal">
                              {formatPrice(line.lineTotal)}
                            </span>
                            <button
                              onClick={() => removeItem(line.id)}
                              aria-label={`Remove ${line.product.name}`}
                              className="rounded-lg p-1.5 text-graymute transition hover:bg-red-50 hover:text-red-600"
                            >
                              <Trash2 className="size-4" aria-hidden />
                            </button>
                          </div>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>

                <div className="border-t border-forest-50 px-5 py-4">
                  <div className="mb-3 flex items-center justify-between text-sm">
                    <span className="text-graymute">Subtotal</span>
                    <span className="font-bold text-charcoal">{formatPrice(totals.subtotal)}</span>
                  </div>
                  <div className="mb-3 flex items-center justify-between text-sm">
                    <span className="text-graymute">You save</span>
                    <span className="font-semibold text-success">−{formatPrice(totals.savings)}</span>
                  </div>
                  <Link
                    href="/cart"
                    onClick={closeDrawer}
                    className={cn(
                      "flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-forest-900 text-sm font-semibold text-white shadow-soft transition hover:bg-forest-800 active:scale-[0.98]"
                    )}
                  >
                    View basket & checkout
                    <ArrowRight className="size-4" aria-hidden />
                  </Link>
                  <p className="mt-2 text-center text-[11px] text-graymute">
                    Simulated cart — no payment is processed in this demo.
                  </p>
                </div>
              </>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
