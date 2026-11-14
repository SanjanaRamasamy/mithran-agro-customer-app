"use client";

import Link from "next/link";
import { memo } from "react";
import { motion } from "framer-motion";
import { Heart, ShoppingBasket, Eye, MapPin, Timer, Ruler, Palette, FlaskConical, Sprout, Package } from "lucide-react";
import type { Product } from "@/types";
import { useShoppingActions } from "@/hooks/useShoppingActions";
import { useWishlist } from "@/contexts/WishlistContext";
import { SmartImage } from "@/components/ui/smart-image";
import { Price } from "@/components/ui/price";
import { Rating } from "@/components/ui/rating";
import { ProduceBadge } from "@/components/ui/produce-badge";
import { getBestVariant, getLowestVariantPrice } from "@/utils/product";
import { categoryKind } from "@/data/categories";
import { cn } from "@/lib/utils";
import { SELLER_BY_ID } from "@/data/sellers";

/** Agri-input spec block — Weight is already shown via variant chips;
 *  this adds the two agronomy lines customers shop fertilizers by. */
function AgriSpec({ product }: { product: Product }) {
  if (!product.application && !product.suitableCrops) return null;
  return (
    <div className="space-y-1 rounded-xl bg-forest-50/60 px-2.5 py-2 text-[11px] leading-snug text-charcoal/80">
      {product.application && (
        <p className="flex min-w-0 gap-1.5">
          <FlaskConical className="mt-0.5 size-3 shrink-0 text-forest-700" aria-hidden />
          <span className="line-clamp-2">
            <span className="font-bold text-forest-900">How to apply: </span>
            {product.application}
          </span>
        </p>
      )}
      {product.suitableCrops && (
        <p className="flex min-w-0 gap-1.5">
          <Sprout className="mt-0.5 size-3 shrink-0 text-forest-700" aria-hidden />
          <span className="truncate">
            <span className="font-bold text-forest-900">For crops: </span>
            {product.suitableCrops}
          </span>
        </p>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Kind-specific meta line — one compact row per product family       */
/* ------------------------------------------------------------------ */

function KindMeta({ product, className }: { product: Product; className?: string }) {
  const kind = categoryKind(product);

  if (kind === "produce") {
    if (!product.origin && !product.freshnessNote) return null;
    return (
      <p className={cn("flex min-w-0 items-center gap-1 truncate text-[11px] text-graymute", className)}>
        <MapPin className="size-3 shrink-0" aria-hidden />
        <span className="truncate">{product.origin}</span>
        {product.freshnessNote && (
          <>
            <span aria-hidden>·</span>
            <Timer className="size-3 shrink-0" aria-hidden />
            <span className="truncate">{product.freshnessNote}</span>
          </>
        )}
      </p>
    );
  }

  if (kind === "fashion") {
    return (
      <p className={cn("flex min-w-0 items-center gap-1 truncate text-[11px] text-graymute", className)}>
        <Palette className="size-3 shrink-0" aria-hidden />
        <span className="truncate">
          {product.colors?.slice(0, 3).join(" · ")}
          {product.fabric ? ` — ${product.fabric}` : ""}
        </span>
      </p>
    );
  }

  if (kind === "agri-input") {
    const details = product.composition ?? product.tagline;
    if (!details) return null;
    return (
      <p className={cn("flex min-w-0 items-center gap-1 truncate text-[11px] text-graymute", className)}>
        <FlaskConical className="size-3 shrink-0" aria-hidden />
        <span className="truncate">{details}</span>
      </p>
    );
  }

  if (kind === "plant") {
    return (
      <p className={cn("flex min-w-0 items-center gap-1 truncate text-[11px] text-graymute", className)}>
        <Package className="size-3 shrink-0" aria-hidden />
        <span className="truncate">
          {[product.potSize, product.plantHeight].filter(Boolean).join(" · ")}
        </span>
      </p>
    );
  }

  if (kind === "seed") {
    return (
      <p className={cn("flex min-w-0 items-center gap-1 truncate text-[11px] text-graymute", className)}>
        <Sprout className="size-3 shrink-0" aria-hidden />
        <span className="truncate">
          {[product.germinationRate ? `${product.germinationRate} germination` : null, product.sowingSeason]
            .filter(Boolean)
            .join(" · ")}
        </span>
      </p>
    );
  }

  if (kind === "garden" || kind === "farm") {
    return (
      <p className={cn("flex min-w-0 items-center gap-1 truncate text-[11px] text-graymute", className)}>
        <Ruler className="size-3 shrink-0" aria-hidden />
        <span className="truncate">{product.application ?? product.tagline}</span>
      </p>
    );
  }

  /* grocery + default */
  if (!product.origin) return null;
  return (
    <p className={cn("flex min-w-0 items-center gap-1 truncate text-[11px] text-graymute", className)}>
      <MapPin className="size-3 shrink-0" aria-hidden />
      <span className="truncate">{product.origin}</span>
    </p>
  );
}

/** Size swatches for fashion cards (replaces weight variant chips). */
function SizeChips({ product }: { product: Product }) {
  const sizes = product.sizes ?? [];
  const shown = sizes.slice(0, 5);
  if (shown.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-1">
      {shown.map((s) => (
        <span
          key={s}
          className="rounded-md border border-forest-100 bg-white px-1.5 py-0.5 text-[10px] font-bold text-charcoal"
        >
          {s}
        </span>
      ))}
      {sizes.length > shown.length && (
        <span className="px-1 py-0.5 text-[10px] font-semibold text-graymute">
          +{sizes.length - shown.length}
        </span>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Variant chips + quick add row (shared)                             */
/* ------------------------------------------------------------------ */

export function VariantChips({ product, className }: { product: Product; className?: string }) {
  const inStock = product.variants.filter((v) => v.inStock);
  const shown = inStock.length ? inStock : product.variants;
  return (
    <div className={cn("flex flex-wrap gap-1.5", className)}>
      {shown.slice(0, 2).map((v) => (
        <span
          key={v.id}
          className={cn(
            "rounded-lg border px-2 py-0.5 text-[11px] font-semibold",
            v.inStock
              ? "border-forest-100 bg-white text-forest-800"
              : "border-gray-200 bg-gray-50 text-gray-400 line-through"
          )}
        >
          {v.name}
        </span>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Grid card — default                                                */
/* ------------------------------------------------------------------ */

interface ProductCardProps {
  product: Product;
  view?: "grid" | "list";
  className?: string;
  priority?: boolean;
}

function ProductCardInner({ product, view = "grid", className, priority }: ProductCardProps) {
  const { addToCart, toggleWishlist } = useShoppingActions();
  const wishlist = useWishlist();
  const wished = wishlist.has(product.id);
  const best = getBestVariant(product);
  const cheapest = getLowestVariantPrice(product);
  const seller = SELLER_BY_ID[product.sellerId];
  const kind = categoryKind(product);
  const href = `/products/${product.slug}`;
  const isFashion = kind === "fashion";

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(product.id, best.id);
  };

  const handleWish = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist(product.id);
  };

  if (view === "list") {
    return (
      <motion.article
        whileHover={{ y: -2 }}
        transition={{ type: "spring", stiffness: 300, damping: 24 }}
        className={cn(
          "group relative flex gap-4 rounded-2xl border border-forest-50 bg-white p-3 shadow-soft transition-shadow hover:shadow-lift sm:p-4",
          className
        )}
      >
        <Link href={href} className="shrink-0" aria-label={`View ${product.name}`}>
          <SmartImage
            src={product.images[0]}
            alt={product.name}
            emojiSeed={product.name}
            rounded="rounded-xl"
            className="size-24 sm:size-28"
            sizes="140px"
            priority={priority}
          />
        </Link>
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <Link href={href}>
                <h3 className="truncate text-sm font-bold text-charcoal hover:text-forest-800 sm:text-base">
                  {product.name}
                </h3>
              </Link>
              {seller && (
                <p className="mt-0.5 truncate text-xs text-graymute">by {seller.farmName}</p>
              )}
              <KindMeta product={product} className="mt-0.5" />
              {kind === "agri-input" && <AgriSpec product={product} />}
            </div>
            <button
              onClick={handleWish}
              aria-label={wished ? "Remove from wishlist" : "Add to wishlist"}
              aria-pressed={wished}
              className={cn(
                "flex size-9 shrink-0 items-center justify-center rounded-xl border transition active:scale-90",
                wished
                  ? "border-red-100 bg-red-50 text-red-500"
                  : "border-forest-100 bg-white text-graymute hover:text-red-500"
              )}
            >
              <Heart className={cn("size-4", wished && "fill-red-500")} aria-hidden />
            </button>
          </div>
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            {product.isOrganic && <ProduceBadge badge="organic" compact />}
            {product.isSeasonal && <ProduceBadge badge="seasonal" compact />}
            {isFashion ? <SizeChips product={product} /> : <VariantChips product={product} />}
          </div>
          {product.reviewCount > 0 && (
            <Rating value={product.rating} count={product.reviewCount} className="mt-1.5" />
          )}
          <div className="mt-auto flex flex-wrap items-end justify-between gap-2 pt-2">
            <Price price={best.price} mrp={best.mrp} />
            <button
              onClick={handleAdd}
              disabled={!best.inStock}
              className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-forest-900 px-4 text-xs font-bold text-white transition hover:bg-forest-800 active:scale-95 disabled:cursor-not-allowed disabled:bg-gray-300"
            >
              <ShoppingBasket className="size-4" aria-hidden />
              {best.inStock ? "Add" : "Sold out"}
            </button>
          </div>
        </div>
      </motion.article>
    );
  }

  return (
    <motion.article
      whileHover={{ y: -4 }}
      transition={{ type: "spring", stiffness: 300, damping: 22 }}
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-2xl border border-forest-50 bg-white shadow-soft transition-shadow duration-300 hover:shadow-lift",
        className
      )}
    >
      {/* Image */}
      <div className="relative">
        <Link href={href} aria-label={`View ${product.name}`} className="block">
          <SmartImage
            src={product.images[0]}
            alt={product.name}
            emojiSeed={product.name}
            rounded="rounded-none"
            className="aspect-square w-full transition-transform duration-500 group-hover:scale-[1.04]"
            priority={priority}
          />
        </Link>

        {/* badges */}
        <div className="absolute left-2.5 top-2.5 flex max-w-[70%] flex-wrap gap-1.5">
          {product.isOrganic && <ProduceBadge badge="organic" compact />}
          {product.isSeasonal && <ProduceBadge badge="seasonal" compact />}
          {product.isNew && !product.isSeasonal && <ProduceBadge badge="new" compact />}
        </div>

        {/* wishlist */}
        <button
          onClick={handleWish}
          aria-label={wished ? "Remove from wishlist" : "Add to wishlist"}
          aria-pressed={wished}
          className={cn(
            "glass absolute right-2.5 top-2.5 flex size-9 items-center justify-center rounded-full transition-all active:scale-90",
            wished ? "text-red-500" : "text-charcoal/70 hover:text-red-500"
          )}
        >
          <Heart className={cn("size-4 transition-transform", wished && "fill-red-500 scale-110")} aria-hidden />
        </button>

        {/* hover quick view */}
        <Link
          href={href}
          aria-label={`Quick view ${product.name}`}
          className="glass absolute bottom-2.5 right-2.5 flex size-9 translate-y-1 items-center justify-center rounded-full text-charcoal opacity-0 transition-all duration-300 hover:text-forest-900 group-hover:translate-y-0 group-hover:opacity-100"
        >
          <Eye className="size-4" aria-hidden />
        </Link>

        {product.badges.includes("limited") && (
          <span className="absolute bottom-2.5 left-2.5 rounded-full bg-orange-500/90 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white backdrop-blur-sm">
            Limited stock
          </span>
        )}
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col gap-1.5 p-3.5">
        {seller && (
          <p className="text-[11px] font-semibold uppercase tracking-wide text-forest-600">
            {seller.farmName}
          </p>
        )}
        <Link href={href} className="line-clamp-2 text-sm font-bold leading-snug text-charcoal hover:text-forest-800">
          {product.name}
        </Link>
        <KindMeta product={product} />
        {kind === "agri-input" && <AgriSpec product={product} />}
        {isFashion ? <SizeChips product={product} /> : <VariantChips product={product} />}
        {product.reviewCount > 0 && (
          <Rating value={product.rating} count={product.reviewCount} className="mt-0.5" />
        )}

        <div className="mt-auto flex items-end justify-between gap-2 pt-2">
          <div className="min-w-0">
            <Price price={cheapest.price} mrp={cheapest.mrp} size="sm" />
            {!best.inStock && (
              <p className="mt-0.5 text-[11px] font-semibold text-red-600">Out of stock</p>
            )}
            {best.inStock && cheapest.name && (
              <p className="mt-0.5 truncate text-[11px] text-graymute">{cheapest.name}</p>
            )}
          </div>
          <motion.button
            onClick={handleAdd}
            disabled={!best.inStock}
            whileTap={{ scale: 0.88 }}
            aria-label={`Add ${product.name} to basket`}
            title={best.inStock ? "Add to basket" : "Out of stock"}
            className={cn(
              "flex size-10 shrink-0 items-center justify-center rounded-xl transition-colors",
              best.inStock
                ? "bg-forest-900 text-white hover:bg-forest-800"
                : "cursor-not-allowed bg-gray-100 text-gray-400"
            )}
          >
            <ShoppingBasket className="size-[18px]" aria-hidden />
          </motion.button>
        </div>
      </div>
    </motion.article>
  );
}

/** Memoized — the grid re-renders on filter changes, cards don't need to. */
export const ProductCard = memo(ProductCardInner);
