"use client";

import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Heart, ShoppingBasket, Trash2 } from "lucide-react";
import type { CartLine } from "@/types";
import { useCart } from "@/contexts/CartContext";
import { useShoppingActions } from "@/hooks/useShoppingActions";
import { useWishlist } from "@/contexts/WishlistContext";
import { SmartImage } from "@/components/ui/smart-image";
import { Price } from "@/components/ui/price";
import { QuantityStepper } from "@/components/ui/quantity-stepper";
import { formatPrice, packLabel } from "@/utils/format";

/** One cart row — quantity stepper, remove, save-for-later, move-to-wishlist. */
export function CartRow({ line }: { line: CartLine }) {
  const { updateQuantity, removeItem, saveForLater } = useCart();
  const { toggleWishlist } = useShoppingActions();

  const stockLeft = line.variant.stockCount ?? 0;
  const minimumQuantity = line.product.prestaShop?.minimumQuantity ?? 1;

  return (
    <AnimatePresence>
      <motion.li
        layout
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, x: -24 }}
        className="flex gap-4 rounded-2xl border border-forest-50 bg-white p-3.5 shadow-soft sm:p-4"
      >
        <Link href={`/products/${line.product.slug}`} className="shrink-0" aria-label={line.product.name}>
          <SmartImage
            src={line.product.images[0]}
            alt={line.product.name}
            emojiSeed={line.product.name}
            rounded="rounded-xl"
            className="size-20 sm:size-24"
            sizes="120px"
          />
        </Link>

        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <Link href={`/products/${line.product.slug}`}>
                <h3 className="truncate text-sm font-bold text-charcoal hover:text-forest-800">
                  {line.product.name}
                </h3>
              </Link>
              <p className="mt-0.5 text-xs text-graymute">
                {line.variant.name} · {packLabel(line.variant.packSize.unit, line.variant.packSize.value)}
              </p>
              {line.variant.inStock ? (
                  line.product.prestaShop && stockLeft < 20 && (
                  <p className="mt-0.5 text-[11px] font-semibold text-orange-600">
                    Only {stockLeft} available
                  </p>
                )
              ) : (
                <p className="mt-0.5 text-[11px] font-semibold text-red-600">
                  Out of stock — remove or save for later
                </p>
              )}
            </div>
            <Price price={line.variant.price} mrp={line.variant.mrp} size="sm" className="shrink-0 justify-end" />
          </div>

          <div className="mt-auto flex flex-wrap items-center justify-between gap-2 pt-3">
            {line.variant.inStock ? (
              <QuantityStepper
                value={line.quantity}
                min={minimumQuantity}
                max={stockLeft || 10}
                onChange={(q) => updateQuantity(line.id, q)}
                size="sm"
                ariaLabel={`Quantity of ${line.product.name}`}
              />
            ) : (
              <span className="text-[11px] font-semibold text-red-600">Unavailable to order</span>
            )}
            <div className="flex items-center gap-1">
              <button
                onClick={() => {
                  saveForLater(line.id);
                }}
                className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-graymute transition hover:bg-forest-50 hover:text-forest-800"
              >
                Save for later
              </button>
              <button
                onClick={() => toggleWishlist(line.product.id)}
                aria-label={`Move ${line.product.name} to wishlist`}
                className="rounded-lg p-2 text-graymute transition hover:bg-red-50 hover:text-red-500"
              >
                <Heart className="size-4" aria-hidden />
              </button>
              <button
                onClick={() => removeItem(line.id)}
                aria-label={`Remove ${line.product.name}`}
                className="rounded-lg p-2 text-graymute transition hover:bg-red-50 hover:text-red-600"
              >
                <Trash2 className="size-4" aria-hidden />
              </button>
            </div>
          </div>
        </div>
      </motion.li>
    </AnimatePresence>
  );
}

/** Group rows by seller when verified seller data exists; otherwise show the store. */
export function CartBySeller({ lines }: { lines: CartLine[] }) {
  const groups = lines.reduce<Record<string, CartLine[]>>((acc, line) => {
    const key = line.product.sellerId;
    (acc[key] ??= []).push(line);
    return acc;
  }, {});

  return (
    <div className="space-y-5">
      {Object.entries(groups).map(([sellerId, groupLines]) => (
        <section key={sellerId || "store"} aria-label={`Basket items from ${sellerId || "Mithran Agro"}`}>
          <div className="mb-2.5 flex items-center justify-between">
            <p className="text-sm font-bold text-charcoal">
              {sellerId ? sellerId : "Mithran Agro"}
            </p>
            <span className="text-xs font-semibold text-forest-700">
              {groupLines.length} {groupLines.length === 1 ? "item" : "items"}
            </span>
          </div>
          <ul className="space-y-3">
            {groupLines.map((line) => (
              <CartRow key={line.id} line={line} />
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

/** Saved-for-later list. */
export function SavedForLater() {
  const { savedLines, moveToCart, removeSaved } = useCart();
  const wishlist = useWishlist();

  if (savedLines.length === 0) return null;

  return (
    <section aria-label="Saved for later" className="mt-10">
      <h2 className="mb-3 text-lg font-bold text-charcoal">
        Saved for later <span className="text-sm font-semibold text-graymute">({savedLines.length})</span>
      </h2>
      <ul className="grid gap-3 sm:grid-cols-2">
        {savedLines.map((line) => (
          <motion.li
            key={line.id}
            layout
            className="flex items-center gap-3 rounded-2xl border border-forest-50 bg-white p-3 shadow-soft"
          >
            <SmartImage
              src={line.product.images[0]}
              alt={line.product.name}
              emojiSeed={line.product.name}
              rounded="rounded-lg"
              className="size-14 shrink-0"
              sizes="56px"
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-charcoal">{line.product.name}</p>
              <p className="text-xs text-graymute">{line.variant.name}</p>
              <p className="mt-0.5 text-sm font-bold text-forest-800">{formatPrice(line.variant.price)}</p>
            </div>
            <div className="flex shrink-0 flex-col gap-1.5">
              <button
                onClick={() => moveToCart(line.id)}
                disabled={!line.variant.inStock}
                title={line.variant.inStock ? "Move to basket" : "Currently unavailable"}
                className="inline-flex items-center gap-1.5 rounded-lg bg-forest-900 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-forest-800 active:scale-95 disabled:cursor-not-allowed disabled:bg-gray-300"
              >
                <ShoppingBasket className="size-3.5" aria-hidden />
                {line.variant.inStock ? "Move to basket" : "Unavailable"}
              </button>
              <div className="flex justify-center gap-1">
                <button
                  onClick={() => {
                    const res = wishlist.toggle(line.product.id);
                    void res;
                    removeSaved(line.id);
                  }}
                  className="rounded-lg p-1.5 text-graymute transition hover:bg-red-50 hover:text-red-500"
                  aria-label="Move to wishlist"
                >
                  <Heart className="size-4" aria-hidden />
                </button>
                <button
                  onClick={() => removeSaved(line.id)}
                  className="rounded-lg p-1.5 text-graymute transition hover:bg-red-50 hover:text-red-600"
                  aria-label="Remove"
                >
                  <Trash2 className="size-4" aria-hidden />
                </button>
              </div>
            </div>
          </motion.li>
        ))}
      </ul>
    </section>
  );
}

/** Empty-cart CTA block (page-level, not drawer). */
export function EmptyCartState() {
  return (
    <div className="flex flex-col items-center rounded-3xl border border-dashed border-forest-200 bg-white/60 px-6 py-16 text-center">
      <span className="text-6xl" aria-hidden>🧺</span>
      <h1 className="mt-4 text-xl font-bold text-charcoal">Your basket is empty</h1>
      <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-graymute">
        Add products from the store catalogue to get started.
      </p>
      <Link
        href="/search"
        className="mt-6 inline-flex h-12 items-center gap-2 rounded-2xl bg-forest-900 px-6 text-sm font-bold text-white shadow-soft transition hover:bg-forest-800 active:scale-[0.98]"
      >
        Start shopping
        <ArrowRight className="size-4" aria-hidden />
      </Link>
    </div>
  );
}
