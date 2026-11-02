"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, BadgePercent } from "lucide-react";
import { OFFERS } from "@/data/offers";
import { cn } from "@/lib/utils";

const THEME_CLASSES = {
  lime: "from-lime-soft to-white border-lime-200 text-lime-deep",
  forest: "from-forest-50 to-white border-forest-200 text-forest-800",
  emerald: "from-emerald-soft to-white border-emerald-200 text-emerald-800",
  amber: "from-amber-50 to-white border-amber-200 text-amber-800",
} as const;

/** Horizontal deals strip — themed coupon-like cards. */
export function DealsStrip() {
  return (
    <div
      className="no-scrollbar -mx-4 flex gap-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:grid sm:grid-cols-3 sm:overflow-visible sm:px-0"
      role="list"
      aria-label="Current offers"
    >
      {OFFERS.map((offer, i) => (
        <motion.div
          key={offer.id}
          role="listitem"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.35, delay: i * 0.08 }}
          whileHover={{ y: -3 }}
        >
          <Link
            href={offer.href}
            className={cn(
              "group flex h-full flex-col rounded-2xl border bg-gradient-to-br p-5 shadow-soft transition-shadow hover:shadow-lift",
              THEME_CLASSES[offer.theme]
            )}
          >
            <div className="flex items-center justify-between">
              {offer.badge && (
                <span className="rounded-full bg-white/80 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide">
                  {offer.badge}
                </span>
              )}
              <BadgePercent className="size-5 opacity-60" aria-hidden />
            </div>
            <p className="mt-3 text-2xl font-extrabold tracking-tight">{offer.discountLabel}</p>
            <p className="mt-0.5 text-sm font-bold">{offer.title}</p>
            <p className="mt-1 flex-1 text-xs leading-relaxed opacity-80">{offer.subtitle}</p>
            <span className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold">
              {offer.ctaLabel}
              <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-1" aria-hidden />
            </span>
          </Link>
        </motion.div>
      ))}
    </div>
  );
}
