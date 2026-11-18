"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, BadgeCheck, MapPin, Package, Sprout } from "lucide-react";
import { SmartImage } from "@/components/ui/smart-image";
import { useCatalog } from "@/contexts/CatalogContext";

/**
 * Featured Farmers — displays real published farms from `useCatalog()`.
 * Never fabricates farm profiles, ratings, or product counts.
 */
export function FarmerStories() {
  const { farms, farmsStatus, products } = useCatalog();

  if (farmsStatus === "loading") {
    return (
      <div className="no-scrollbar -mx-4 flex gap-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="shimmer h-72 w-64 shrink-0 rounded-2xl sm:w-auto" />
        ))}
      </div>
    );
  }

  if (farmsStatus !== "ready" || farms.length === 0) {
    return (
      <div className="flex flex-col items-start justify-between gap-4 rounded-2xl border border-forest-100 bg-white p-6 shadow-soft sm:flex-row sm:items-center">
        <div className="flex items-start gap-3">
          <Sprout className="mt-0.5 size-6 shrink-0 text-forest-700" aria-hidden />
          <div>
            <p className="text-sm font-bold text-charcoal">
              Partner farm profiles are managed in PrestaShop
            </p>
            <p className="mt-0.5 text-xs text-graymute">
              Visit Our Farms for directory status, or browse all active PrestaShop products.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/farms"
            className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-forest-200 bg-white px-4 text-xs font-bold text-forest-800 transition hover:bg-forest-50"
          >
            Our Farms
          </Link>
          <Link
            href="/products"
            className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-forest-900 px-4 text-xs font-bold text-white transition hover:bg-forest-800"
          >
            Shop All Products
            <ArrowRight className="size-3.5" aria-hidden />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div
      className="no-scrollbar -mx-4 flex gap-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 lg:grid-cols-4"
      role="list"
      aria-label="Meet our farmers"
    >
      {farms.slice(0, 4).map((farm, i) => {
        const farmProducts = products.filter((p) => farm.productIds.includes(p.id));
        return (
          <motion.article
            key={farm.id}
            role="listitem"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.4, delay: i * 0.07 }}
            className="group flex w-64 shrink-0 flex-col overflow-hidden rounded-2xl border border-forest-50 bg-white shadow-soft transition-shadow hover:shadow-lift sm:w-auto"
          >
            <div className="relative">
              <SmartImage
                src={farm.coverUrl || farm.logoUrl}
                alt={farm.name}
                emojiSeed={farm.name}
                rounded="rounded-none"
                className="aspect-[4/3] w-full transition-transform duration-500 group-hover:scale-[1.03]"
                sizes="(max-width: 640px) 80vw, 25vw"
                priority={i < 4}
              />
              {farm.isVerified && (
                <span
                  title={farm.verificationNote}
                  className="glass absolute left-3 top-3 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold text-forest-900"
                >
                  <BadgeCheck className="size-3 shrink-0" aria-hidden />
                  Verified Farm
                </span>
              )}
            </div>
            <div className="flex flex-1 flex-col p-4">
              <h3 className="truncate text-sm font-bold text-charcoal">{farm.name}</h3>
              {farm.ownerName && (
                <p className="mt-0.5 truncate text-xs font-semibold text-forest-700">
                  {farm.ownerName}
                </p>
              )}
              {farm.location && (
                <p className="mt-1 flex items-center gap-1 text-[11px] text-graymute">
                  <MapPin className="size-3 shrink-0" aria-hidden />
                  {farm.location}
                </p>
              )}
              <p className="mt-2 flex flex-1 items-center gap-1.5 text-[11px] font-semibold text-charcoal">
                <Package className="size-3.5 shrink-0 text-forest-600" aria-hidden />
                {farmProducts.length} {farmProducts.length === 1 ? "product" : "products"} listed
              </p>
              <Link
                href={`/farms/${farm.slug}`}
                className="mt-3 inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-xl border border-forest-200 bg-white text-xs font-bold text-forest-800 transition hover:bg-forest-50 active:scale-[0.98]"
              >
                Visit Farm
              </Link>
            </div>
          </motion.article>
        );
      })}
    </div>
  );
}
