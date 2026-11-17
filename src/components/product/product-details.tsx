"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  BadgeCheck,
  Heart,
  MapPin,
  RefreshCcw,
  ShieldCheck,
  ShoppingBasket,
  Sparkles,
  Truck,
  Zap,
} from "lucide-react";
import type { Product } from "@/types";
import { SELLER_BY_ID } from "@/data/sellers";
import { CATEGORY_BY_ID, categoryKind } from "@/data/categories";
import { useActivity } from "@/contexts/ActivityContext";
import { useShoppingActions } from "@/hooks/useShoppingActions";
import { useWishlist } from "@/contexts/WishlistContext";
import { ProductGallery } from "./product-gallery";
import { ProductRail } from "@/components/home/product-rail";
import { Rating, RatingBar } from "@/components/ui/rating";
import { Price } from "@/components/ui/price";
import { ProduceBadge } from "@/components/ui/produce-badge";
import { QuantityStepper } from "@/components/ui/quantity-stepper";
import { SectionHeading } from "@/components/ui/section-heading";
import { SmartImage } from "@/components/ui/smart-image";
import { reviewsForProduct, ratingBreakdown } from "@/data/reviews";
import { formatPrice, formatDate, calcDiscountPercent } from "@/utils/format";
import { cn } from "@/lib/utils";
import { sanitizeProductDescription } from "@/lib/product-description";
import { FAQS } from "@/data/banners";
import { useCatalog } from "@/contexts/CatalogContext";

/* ------------------------------------------------------------------ */
/*  Buy box                                                            */
/* ------------------------------------------------------------------ */

function BuyBox({ product }: { product: Product }) {
  const minimumQuantity = product.prestaShop?.minimumQuantity ?? 1;
  const [variantId, setVariantId] = useState(product.variants.find((v) => v.inStock)?.id ?? product.variants[0].id);
  const [qty, setQty] = useState(minimumQuantity);
  const { addToCart, toggleWishlist } = useShoppingActions();
  const wishlist = useWishlist();
  const variant = product.variants.find((v) => v.id === variantId) ?? product.variants[0];
  const wished = wishlist.has(product.id);
  const canPurchase =
    variant.inStock &&
    product.prestaShop?.active !== false &&
    product.prestaShop?.availableForOrder !== false;
  const maxQuantity = product.prestaShop?.quantity ?? variant.stockCount ?? 10;
  const discount = calcDiscountPercent(variant.mrp, variant.price);
  const { trackView } = useActivity();

  useEffect(() => {
    trackView(product.id);
  }, [product.id, trackView]);

  return (
    <div className="space-y-5">
      {/* Title block */}
      <div>
        <div className="flex flex-wrap items-center gap-2">
          {product.isOrganic && <ProduceBadge badge="organic" />}
          {product.isSeasonal && <ProduceBadge badge="seasonal" />}
          {product.isNew && <ProduceBadge badge="new" />}
        </div>
        <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-charcoal sm:text-3xl">
          {product.name}
        </h1>
        {product.tagline && <p className="mt-1 text-sm text-graymute">{product.tagline}</p>}
        {product.reviewCount > 0 && (
          <div className="mt-2"><Rating value={product.rating} count={product.reviewCount} size="md" /></div>
        )}
      </div>

      {/* Price block */}
      <div className="rounded-2xl border border-forest-50 bg-white p-5 shadow-soft">
        <Price price={variant.price} mrp={variant.mrp} size="xl" />
        {discount > 0 && (
          <p className="mt-1 text-xs font-semibold text-success">
            You save {formatPrice(variant.mrp - variant.price)} ({discount}%) vs. supermarket M.R.P.
          </p>
        )}
        <p className="mt-1 text-xs text-graymute">{variant.name}</p>

        {/* Variants */}
        <div className="mt-4" role="radiogroup" aria-label={categoryKind(product) === "fashion" ? "Select size" : "Pack size"}>
          <p className="mb-2 text-[11px] font-bold uppercase tracking-widest text-graymute">
            {categoryKind(product) === "fashion" ? "Select size" : "Pack size"}
          </p>
          <div className="flex flex-wrap gap-2">
            {product.variants.map((v) => (
              <button
                key={v.id}
                role="radio"
                aria-checked={v.id === variantId}
                disabled={!v.inStock}
                onClick={() => setVariantId(v.id)}
                className={cn(
                  "rounded-xl border px-3.5 py-2 text-left transition active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50",
                  v.id === variantId
                    ? "border-forest-800 bg-forest-900 text-white shadow-soft"
                    : "border-forest-100 bg-white hover:border-forest-300"
                )}
              >
                <span className="block text-xs font-bold">{v.name}</span>
                <span className={cn("block text-[11px]", v.id === variantId ? "text-forest-100" : "text-graymute")}>
                  {formatPrice(v.price)}
                  {!v.inStock && " · sold out"}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Stock + qty + CTA */}
        <div className="mt-5 flex flex-wrap items-center gap-3">
          {canPurchase ? (
            <QuantityStepper
              value={qty}
              onChange={setQty}
              min={minimumQuantity}
              max={Math.max(minimumQuantity, maxQuantity)}
              ariaLabel="Quantity to add"
            />
          ) : (
            <span className="text-xs font-bold text-red-600">
              {product.prestaShop?.availableForOrder === false ? "Unavailable for order" : "Out of stock"}
            </span>
          )}
          {canPurchase && product.prestaShop && (
            <span className="text-xs text-graymute">{maxQuantity} available</span>
          )}
        </div>
        <div className="mt-3 flex gap-2.5">
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => addToCart(product.id, variant.id, qty)}
            disabled={!canPurchase}
            className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-2xl bg-forest-900 text-sm font-bold text-white shadow-soft transition hover:bg-forest-800 disabled:cursor-not-allowed disabled:bg-gray-300"
          >
            <ShoppingBasket className="size-[18px]" aria-hidden />
            {canPurchase ? "Add to basket" : "Out of stock"}
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => toggleWishlist(product.id)}
            aria-label={wished ? "Remove from wishlist" : "Add to wishlist"}
            aria-pressed={wished}
            className={cn(
              "flex size-12 items-center justify-center rounded-2xl border transition active:scale-90",
              wished ? "border-red-100 bg-red-50 text-red-500" : "border-forest-100 bg-white text-graymute hover:text-red-500"
            )}
          >
            <Heart className={cn("size-5", wished && "fill-red-500")} aria-hidden />
          </motion.button>
        </div>

        {/* delivery promises */}
        {!product.prestaShop && <div className="mt-5 grid grid-cols-2 gap-2.5 text-xs">
          {product.deliveryEligible && (
            <span className="flex items-center gap-2 rounded-xl bg-lime-soft px-3 py-2.5 font-semibold text-lime-deep">
              <Zap className="size-4 shrink-0" aria-hidden />
              Same-day slot available
            </span>
          )}
          <span className="flex items-center gap-2 rounded-xl bg-forest-50 px-3 py-2.5 font-semibold text-forest-800">
            <Truck className="size-4 shrink-0" aria-hidden />
            Free delivery over ₹499
          </span>
          <span className="flex items-center gap-2 rounded-xl bg-forest-50 px-3 py-2.5 font-semibold text-forest-800">
            <RefreshCcw className="size-4 shrink-0" aria-hidden />
            24h freshness refund
          </span>
          {product.isOrganic && (
            <span className="flex items-center gap-2 rounded-xl bg-forest-50 px-3 py-2.5 font-semibold text-forest-800">
              <ShieldCheck className="size-4 shrink-0" aria-hidden />
              Organic certified
            </span>
          )}
        </div>}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Info panels                                                        */
/* ------------------------------------------------------------------ */

function InfoPanels({ product }: { product: Product }) {
  const seller = SELLER_BY_ID[product.sellerId];
  const category = CATEGORY_BY_ID[product.categoryId];
  const kind = categoryKind(product);

  const rows: { label: string; value: string }[] = [];
  if (product.harvestDate) {
    rows.push({ label: kind === "produce" ? "Harvest date" : "Listed since", value: formatDate(product.harvestDate, "long") });
  }
  if (product.origin) rows.push({ label: kind === "fashion" ? "Ships from" : "Origin", value: product.origin });
  if (product.storage) rows.push({ label: "Care & storage", value: product.storage });

  /* kind-specific attribute rows */
  if (kind === "fashion") {
    if (product.sizes?.length) rows.push({ label: "Available sizes", value: product.sizes.join(", ") });
    if (product.colors?.length) rows.push({ label: "Colour variants", value: product.colors.join(", ") });
    if (product.fabric) rows.push({ label: "Fabric", value: product.fabric });
    if (product.fit) rows.push({ label: "Fit", value: product.fit });
  } else if (kind === "agri-input") {
    if (product.composition) rows.push({ label: "Composition", value: product.composition });
    if (product.application) rows.push({ label: "How to apply", value: product.application });
    if (product.suitableCrops) rows.push({ label: "Suitable crops", value: product.suitableCrops });
  } else if (kind === "plant") {
    if (product.potSize) rows.push({ label: "Pot size", value: product.potSize });
    if (product.plantHeight) rows.push({ label: "Plant height", value: product.plantHeight });
    if (product.careInstructions) rows.push({ label: "Care instructions", value: product.careInstructions });
  } else if (kind === "seed") {
    if (product.germinationRate) rows.push({ label: "Germination rate", value: product.germinationRate });
    if (product.sowingSeason) rows.push({ label: "Sowing season", value: product.sowingSeason });
  } else if (product.storageLifeDays > 0) {
    rows.push({ label: "Peak freshness", value: `${product.storageLifeDays} days from harvest` });
  }

  const aboutTitle =
    kind === "produce" ? "About this produce"
    : kind === "fashion" ? "About this garment"
    : kind === "plant" ? "About this plant"
    : kind === "seed" ? "About these seeds"
    : kind === "agri-input" ? "About this input"
    : "About this product";

  const sellerTitle =
    kind === "fashion" ? "Meet the maker"
    : kind === "plant" || kind === "seed" ? "Meet your nursery"
    : kind === "garden" || kind === "farm" ? "About the seller"
    : "Meet your grower";
  const hasProductDetails = Boolean(
    product.description || rows.length || product.organicDetails || product.nutrition
  );
  const descriptionHtml = sanitizeProductDescription(product.description);

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      {hasProductDetails && <section aria-label="Product details" className="rounded-2xl border border-forest-50 bg-white p-5 shadow-soft">
        <h2 className="text-base font-bold text-charcoal">{aboutTitle}</h2>
        {descriptionHtml && (
          <div
            className="mt-2 space-y-3 text-sm leading-relaxed text-graymute [&_h1]:text-lg [&_h1]:font-bold [&_h2]:text-base [&_h2]:font-bold [&_h3]:font-semibold [&_h4]:font-semibold [&_h5]:font-semibold [&_h6]:font-semibold [&_li]:pl-1 [&_ol]:list-decimal [&_ol]:pl-5 [&_strong]:font-semibold [&_ul]:list-disc [&_ul]:pl-5"
            dangerouslySetInnerHTML={{ __html: descriptionHtml }}
          />
        )}

        <dl className="mt-4 divide-y divide-forest-50">
          {rows.map((r) => (
            <div key={r.label} className="flex items-start justify-between gap-4 py-2.5">
              <dt className="shrink-0 text-xs font-bold uppercase tracking-wide text-graymute">{r.label}</dt>
              <dd className="text-right text-xs font-medium leading-relaxed text-charcoal">{r.value}</dd>
            </div>
          ))}
        </dl>

        {product.organicDetails && (
          <div className="mt-4 rounded-xl bg-lime-soft/60 p-3.5">
            <p className="flex items-center gap-1.5 text-xs font-bold text-lime-deep">
              <BadgeCheck className="size-4" aria-hidden /> {kind === "fashion" ? "Material details" : "Organic details"}
            </p>
            <p className="mt-1 text-xs leading-relaxed text-lime-deep/90">{product.organicDetails}</p>
          </div>
        )}

        {product.nutrition && (
          <div className="mt-4">
            <p className="text-xs font-bold uppercase tracking-wide text-graymute">Nutrition highlights</p>
            <p className="mt-1 text-xs text-charcoal">{product.nutrition.calories}</p>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {product.nutrition.keyNutrients?.map((n) => (
                <span key={n} className="rounded-full bg-forest-50 px-2.5 py-1 text-[11px] font-semibold text-forest-800">
                  {n}
                </span>
              ))}
            </div>
          </div>
        )}
      </section>}

      <section aria-label={seller ? "Seller information" : "Category information"} className="rounded-2xl border border-forest-50 bg-white p-5 shadow-soft">
        <h2 className="text-base font-bold text-charcoal">{seller ? sellerTitle : "Category"}</h2>
        {seller && (
          <>
            <div className="mt-3 flex items-center gap-3.5">
              <SmartImage
                src={seller.avatar}
                alt={seller.name}
                emojiSeed="farmer"
                rounded="rounded-full"
                className="size-14 shrink-0 ring-2 ring-forest-100"
                sizes="56px"
              />
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-charcoal">{seller.farmName}</p>
                <p className="truncate text-xs text-graymute">
                  {seller.name} · farming since {seller.since}
                </p>
                <div className="mt-1">
                  <Rating value={seller.rating} count={seller.reviewCount} />
                </div>
              </div>
            </div>
            <p className="mt-3 text-xs leading-relaxed text-graymute">{seller.bio}</p>
            <p className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-forest-800">
              <MapPin className="size-3.5" aria-hidden />
              {seller.location} · {seller.distanceKm} km away
            </p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {seller.certifications.map((c) => (
                <span key={c} className="inline-flex items-center gap-1 rounded-full bg-forest-50 px-2.5 py-1 text-[10px] font-bold text-forest-800">
                  <BadgeCheck className="size-3" aria-hidden /> {c}
                </span>
              ))}
            </div>
            <Link
              href={`/search?seller=${seller.id}`}
              className="mt-4 inline-flex h-10 items-center rounded-xl border border-forest-200 bg-white px-4 text-xs font-bold text-forest-800 transition hover:bg-forest-50"
            >
              Shop all {seller.productsCount} products from this farm
            </Link>
          </>
        )}
        <p className="mt-4 text-[11px] text-graymute">
          Category:{" "}
          <Link href={`/category/${category?.slug ?? product.categoryId}`} className="font-semibold text-forest-700 hover:underline">
            {product.prestaShop?.categoryName || category?.name || "Browse category"}
          </Link>
        </p>
      </section>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Reviews                                                            */
/* ------------------------------------------------------------------ */

function ReviewsSection({ product }: { product: Product }) {
  const reviews = reviewsForProduct(product.id);
  const breakdown = ratingBreakdown(product);
  const [helpful, setHelpful] = useState<Record<string, boolean>>({});
  const [visible, setVisible] = useState(4);

  return (
    <section aria-label="Customer reviews" className="rounded-2xl border border-forest-50 bg-white p-5 shadow-soft sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-6">
        <div>
          <h2 className="text-lg font-bold text-charcoal">Ratings & reviews</h2>
          <div className="mt-2 flex items-end gap-3">
            <span className="text-4xl font-extrabold tracking-tight text-charcoal">{product.rating.toFixed(1)}</span>
            <div className="pb-1">
              <Rating value={product.rating} showValue={false} size="md" />
              <p className="mt-0.5 text-xs text-graymute">{product.reviewCount.toLocaleString("en-IN")} verified ratings</p>
            </div>
          </div>
        </div>
        <div className="w-full max-w-xs space-y-1.5">
          {breakdown.map((b) => (
            <RatingBar key={b.star} star={b.star} percent={b.percent} count={b.count} />
          ))}
        </div>
      </div>

      <div className="mt-6 divide-y divide-forest-50">
        {reviews.length === 0 && (
          <p className="py-8 text-center text-sm text-graymute">
            No written reviews yet for this harvest — be the first to rate it after delivery.
          </p>
        )}
        {reviews.slice(0, visible).map((r) => (
          <article key={r.id} className="py-4 first:pt-0">
            <div className="flex items-center gap-3">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-forest-100 text-xs font-bold text-forest-800">
                {r.userName.charAt(0)}
              </span>
              <div className="min-w-0 flex-1">
                <p className="flex flex-wrap items-center gap-2 text-sm font-bold text-charcoal">
                  {r.userName}
                  {r.verifiedPurchase && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-soft px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                      <BadgeCheck className="size-3" aria-hidden /> Verified purchase
                    </span>
                  )}
                </p>
                <Rating value={r.rating} showValue={false} />
              </div>
              <span className="shrink-0 text-xs text-graymute">{formatDate(r.date)}</span>
            </div>
            <h3 className="mt-2.5 text-sm font-bold text-charcoal">{r.title}</h3>
            <p className="mt-1 text-sm leading-relaxed text-graymute">{r.body}</p>
            <button
              onClick={() => setHelpful((h) => ({ ...h, [r.id]: !h[r.id] }))}
              aria-pressed={!!helpful[r.id]}
              className={cn(
                "mt-2.5 inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition active:scale-95",
                helpful[r.id] ? "border-forest-300 bg-forest-50 text-forest-900" : "border-forest-100 text-graymute hover:text-charcoal"
              )}
            >
              <Sparkles className="size-3.5" aria-hidden />
              Helpful ({r.helpfulCount + (helpful[r.id] ? 1 : 0)})
            </button>
          </article>
        ))}
      </div>

      {visible < reviews.length && (
        <button
          onClick={() => setVisible((v) => v + 4)}
          className="mt-4 inline-flex h-10 items-center rounded-xl border border-forest-200 bg-white px-4 text-xs font-bold text-forest-800 transition hover:bg-forest-50"
        >
          Show more reviews
        </button>
      )}
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  FAQ accordion (compact)                                            */
/* ------------------------------------------------------------------ */

function FaqSection() {
  return (
    <section aria-label="Frequently asked questions" className="rounded-2xl border border-forest-50 bg-white p-5 shadow-soft sm:p-6">
      <h2 className="text-lg font-bold text-charcoal">Freshness, guaranteed</h2>
      <div className="mt-3 divide-y divide-forest-50">
        {FAQS.map((f) => (
          <details key={f.question} className="group py-3">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-semibold text-charcoal [&::-webkit-details-marker]:hidden">
              {f.question}
              <span className="text-forest-600 transition group-open:rotate-45" aria-hidden>+</span>
            </summary>
            <p className="mt-2 text-sm leading-relaxed text-graymute">{f.answer}</p>
          </details>
        ))}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Related products                                                   */
/* ------------------------------------------------------------------ */

function RelatedProducts({ product }: { product: Product }) {
  const { products } = useCatalog();
  const related = products.filter((candidate) =>
    candidate.id !== product.id &&
    candidate.prestaShop?.categoryIds.some((id) => product.prestaShop?.categoryIds.includes(id))
  ).slice(0, 10);

  if (!related.length) return null;

  return (
    <section aria-label="Related products">
      <SectionHeading
        title="Pairs beautifully with"
        subtitle={`More from ${CATEGORY_BY_ID[product.categoryId]?.name ?? "the marketplace"}`}
        viewAllHref={`/category/${product.categoryId}`}
      />
      <ProductRail products={related} />
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function ProductDetailsContent({ product }: { product: Product }) {
  return (
    <div className="mx-auto max-w-7xl space-y-8 px-4 py-6 sm:px-6 sm:py-8">
      {/* breadcrumbs */}
      <nav aria-label="Breadcrumb" className="text-xs text-graymute">
        <ol className="flex flex-wrap items-center gap-1.5">
          <li><Link href="/" className="hover:text-forest-800">Home</Link></li>
          <li aria-hidden>/</li>
          <li>
            <Link href={`/category/${product.categoryId}`} className="hover:text-forest-800">
              {CATEGORY_BY_ID[product.categoryId]?.name}
            </Link>
          </li>
          <li aria-hidden>/</li>
          <li className="font-semibold text-charcoal">{product.name}</li>
        </ol>
      </nav>

      <div className="grid gap-8 lg:grid-cols-2">
        <ProductGallery product={product} />
        <BuyBox product={product} />
      </div>

      <InfoPanels product={product} />
      {product.reviewCount > 0 && <ReviewsSection product={product} />}
      {!product.prestaShop && <FaqSection />}
      <RelatedProducts product={product} />

      {/* sticky mobile buy bar */}
      <div className="glass-strong fixed inset-x-3 bottom-20 z-40 flex items-center justify-between gap-3 rounded-2xl p-3 md:hidden">
        <div className="min-w-0 pl-1">
          <p className="truncate text-xs font-bold text-charcoal">{product.name}</p>
          <Price price={product.variants.find((v) => v.inStock)?.price ?? product.variants[0].price} size="sm" />
        </div>
        <MobileAddButton product={product} />
      </div>
    </div>
  );
}

function MobileAddButton({ product }: { product: Product }) {
  const { addToCart } = useShoppingActions();
  const variant = product.variants.find((v) => v.inStock) ?? product.variants[0];
  return (
    <button
      onClick={() => addToCart(product.id, variant.id)}
      disabled={!variant.inStock}
      className="inline-flex h-11 shrink-0 items-center gap-2 rounded-xl bg-forest-900 px-5 text-sm font-bold text-white active:scale-95 disabled:bg-gray-300"
    >
      <ShoppingBasket className="size-4" aria-hidden />
      {variant.inStock ? "Add" : "Sold out"}
    </button>
  );
}
