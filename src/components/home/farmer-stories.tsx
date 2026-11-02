"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { BadgeCheck, MapPin, Package, Star } from "lucide-react";
import { FARMER_STORIES } from "@/data/banners";
import { SmartImage } from "@/components/ui/smart-image";
import { SELLER_BY_ID } from "@/data/sellers";

/**
 * Featured Farmers — farmer photo, farm name, location, certifications,
 * product count and a Visit Farm call-to-action.
 */
export function FarmerStories() {
  return (
    <div
      className="no-scrollbar -mx-4 flex gap-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 lg:grid-cols-4"
      role="list"
      aria-label="Meet our farmers"
    >
      {FARMER_STORIES.map((farmer, i) => {
        const seller = SELLER_BY_ID[farmer.sellerId];
        const primaryCert = seller?.certifications?.[0];
        return (
          <motion.article
            key={farmer.id}
            role="listitem"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.4, delay: i * 0.07 }}
            className="group w-64 shrink-0 overflow-hidden rounded-2xl border border-forest-50 bg-white shadow-soft transition-shadow hover:shadow-lift sm:w-auto"
          >
            <div className="relative">
              <SmartImage
                src={farmer.image}
                alt={`${farmer.name} — ${farmer.farmName}`}
                emojiSeed="farmer"
                rounded="rounded-none"
                className="aspect-[4/3] w-full transition-transform duration-500 group-hover:scale-[1.03]"
                sizes="(max-width: 640px) 80vw, 25vw"
                priority={i < 4}
              />
              {primaryCert && (
                <span className="glass absolute left-3 top-3 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold text-forest-900">
                  <BadgeCheck className="size-3 shrink-0" aria-hidden />
                  {primaryCert}
                </span>
              )}
            </div>
            <div className="p-4">
              <div className="flex items-center justify-between gap-2">
                <h3 className="truncate text-sm font-bold text-charcoal">{farmer.farmName}</h3>
                {seller && (
                  <span className="inline-flex shrink-0 items-center gap-1 text-xs font-bold text-forest-700">
                    <Star className="size-3.5 fill-amber-400 text-amber-400" aria-hidden />
                    {seller.rating}
                  </span>
                )}
              </div>
              <p className="mt-0.5 truncate text-xs font-semibold text-forest-700">
                {farmer.name}
              </p>
              <p className="mt-1 flex items-center gap-1 text-[11px] text-graymute">
                <MapPin className="size-3 shrink-0" aria-hidden />
                {farmer.location}
              </p>
              <p className="mt-2 flex items-center gap-1.5 text-[11px] font-semibold text-charcoal">
                <Package className="size-3.5 shrink-0 text-forest-600" aria-hidden />
                {seller?.productsCount ?? 0} products on the marketplace
              </p>
              <Link
                href={`/search?seller=${farmer.sellerId}`}
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
