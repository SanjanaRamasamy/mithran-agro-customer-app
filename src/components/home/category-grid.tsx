"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { CATEGORIES, effectiveItemCount } from "@/data/categories";
import { SmartImage } from "@/components/ui/smart-image";

/**
 * Shop by Category — the five Mithren Agro business lines as rich
 * image cards. Mobile: horizontal snap scroll.
 */
export function CategoryGrid() {
  const featured = CATEGORIES.filter((c) => c.featured);

  return (
    <div
      className="no-scrollbar -mx-4 flex gap-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:grid sm:grid-cols-3 sm:overflow-visible sm:px-0 lg:grid-cols-5"
      role="list"
      aria-label="Shop by category"
    >
      {featured.map((cat, i) => {
        const Icon = cat.icon;
        const count = effectiveItemCount(cat);
        return (
          <motion.div
            key={cat.id}
            role="listitem"
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.35, delay: Math.min(i * 0.05, 0.3), ease: "easeOut" }}
            className="w-52 shrink-0 sm:w-auto"
          >
            <Link
              href={`/category/${cat.slug}`}
              className="group relative flex h-52 flex-col justify-end overflow-hidden rounded-3xl border border-forest-50 shadow-soft transition-shadow hover:shadow-lift"
            >
              <SmartImage
                src={cat.image}
                alt={cat.name}
                emojiSeed={cat.name}
                rounded="rounded-none"
                className="absolute inset-0 size-full transition-transform duration-500 group-hover:scale-105"
                sizes="(max-width: 640px) 80vw, (max-width: 1024px) 45vw, 20vw"
                priority={i < 5}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-forest-950/85 via-forest-950/30 to-transparent" />
              <div className="relative flex items-end justify-between gap-2 p-4 text-white">
                <div className="min-w-0">
                  <span className="mb-1.5 inline-flex size-8 items-center justify-center rounded-xl bg-white/15 ring-1 ring-white/25 backdrop-blur-sm">
                    <Icon className="size-4" aria-hidden />
                  </span>
                  <p className="truncate text-base font-extrabold tracking-tight">{cat.name}</p>
                  <p className="text-[11px] font-semibold text-white/75">{count} products</p>
                </div>
                <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-white/15 ring-1 ring-white/25 transition-transform duration-300 group-hover:translate-x-0.5">
                  <ArrowRight className="size-4" aria-hidden />
                </span>
              </div>
            </Link>
          </motion.div>
        );
      })}
    </div>
  );
}
