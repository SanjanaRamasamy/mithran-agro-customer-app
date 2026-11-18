"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { BadgeCheck, MapPin } from "lucide-react";
import { SmartImage } from "@/components/ui/smart-image";
import { useCatalog } from "@/contexts/CatalogContext";

/**
 * Featured farms strip — every published Mithran Agro farm linking to its
 * own `/farms/[slug]` profile.
 */
export function FeaturedBrands() {
  const { farms, products } = useCatalog();
  if (farms.length === 0) return null;

  return (
    <div className="no-scrollbar -mx-4 flex gap-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:grid sm:grid-cols-3 sm:overflow-visible sm:px-0 lg:grid-cols-5">
      {farms.map((farm, i) => {
        const count = products.filter((p) => farm.productIds.includes(p.id)).length;
        return (
          <motion.div
            key={farm.id}
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.3, delay: Math.min(i * 0.04, 0.3) }}
            className="w-52 shrink-0 sm:w-auto"
          >
            <Link
              href={`/farms/${farm.slug}`}
              className="group flex h-full flex-col items-center gap-2.5 rounded-2xl border border-forest-50 bg-white p-5 text-center shadow-soft transition hover:-translate-y-0.5 hover:shadow-lift"
            >
              <span className="relative">
                <SmartImage
                  src={farm.logoUrl || farm.coverUrl}
                  alt={farm.name}
                  emojiSeed={farm.name}
                  rounded="rounded-full"
                  className="size-16 ring-2 ring-forest-100 transition group-hover:ring-forest-300"
                  sizes="64px"
                />
                {farm.isVerified && (
                  <span className="absolute -bottom-1 -right-1 flex size-5 items-center justify-center rounded-full bg-forest-800 text-white ring-2 ring-white">
                    <BadgeCheck className="size-3" aria-hidden />
                  </span>
                )}
              </span>
              <span>
                <span className="block text-sm font-bold text-charcoal group-hover:text-forest-800">
                  {farm.name}
                </span>
                {farm.location && (
                  <span className="mt-0.5 flex items-center justify-center gap-1 text-[11px] text-graymute">
                    <MapPin className="size-3" aria-hidden />
                    {farm.location}
                  </span>
                )}
              </span>
              <span className="rounded-full bg-forest-50 px-2.5 py-0.5 text-[11px] font-bold text-forest-700">
                {count} {count === 1 ? "product" : "products"}
              </span>
            </Link>
          </motion.div>
        );
      })}
    </div>
  );
}
