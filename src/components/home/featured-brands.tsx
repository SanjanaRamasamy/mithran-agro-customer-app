"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { BadgeCheck, MapPin } from "lucide-react";
import { SELLERS } from "@/data/sellers";
import { SmartImage } from "@/components/ui/smart-image";

/**
 * Featured brands strip — every verified Mithren Agro seller as a brand
 * card linking to their filtered catalogue.
 */
export function FeaturedBrands() {
  return (
    <div className="no-scrollbar -mx-4 flex gap-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:grid sm:grid-cols-3 sm:overflow-visible sm:px-0 lg:grid-cols-5">
      {SELLERS.map((s, i) => (
        <motion.div
          key={s.id}
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.3, delay: Math.min(i * 0.04, 0.3) }}
          className="w-52 shrink-0 sm:w-auto"
        >
          <Link
            href={`/search?seller=${s.id}`}
            className="group flex h-full flex-col items-center gap-2.5 rounded-2xl border border-forest-50 bg-white p-5 text-center shadow-soft transition hover:-translate-y-0.5 hover:shadow-lift"
          >
            <span className="relative">
              <SmartImage
                src={s.avatar}
                alt={s.farmName}
                emojiSeed={s.farmName}
                rounded="rounded-full"
                className="size-16 ring-2 ring-forest-100 transition group-hover:ring-forest-300"
                sizes="64px"
              />
              {s.isOrganicCertified && (
                <span className="absolute -bottom-1 -right-1 flex size-5 items-center justify-center rounded-full bg-forest-800 text-white ring-2 ring-white">
                  <BadgeCheck className="size-3" aria-hidden />
                </span>
              )}
            </span>
            <span>
              <span className="block text-sm font-bold text-charcoal group-hover:text-forest-800">
                {s.farmName}
              </span>
              <span className="mt-0.5 flex items-center justify-center gap-1 text-[11px] text-graymute">
                <MapPin className="size-3" aria-hidden />
                {s.location.split(",")[0]} · {s.distanceKm} km
              </span>
            </span>
            <span className="rounded-full bg-forest-50 px-2.5 py-0.5 text-[11px] font-bold text-forest-700">
              ★ {s.rating} · {s.productsCount} products
            </span>
          </Link>
        </motion.div>
      ))}
    </div>
  );
}
