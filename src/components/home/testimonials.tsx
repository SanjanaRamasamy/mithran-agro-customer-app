"use client";

import { motion } from "framer-motion";
import { Quote, Star } from "lucide-react";
import { TESTIMONIALS } from "@/data/banners";

/** Customer testimonials — social proof for the marketplace. */
export function Testimonials() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" role="list" aria-label="Customer testimonials">
      {TESTIMONIALS.map((t, i) => (
        <motion.figure
          key={t.id}
          role="listitem"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.4, delay: i * 0.08 }}
          className="flex h-full flex-col rounded-2xl border border-forest-50 bg-white p-6 shadow-soft transition-shadow hover:shadow-lift"
        >
          <Quote className="size-6 text-forest-200" aria-hidden />
          <div className="mt-2 flex items-center gap-0.5" aria-label={`${t.rating} out of 5 stars`}>
            {Array.from({ length: 5 }).map((_, s) => (
              <Star
                key={s}
                className={s < t.rating ? "size-3.5 fill-amber-400 text-amber-400" : "size-3.5 text-gray-200"}
                aria-hidden
              />
            ))}
          </div>
          <blockquote className="mt-3 flex-1 text-sm leading-relaxed text-charcoal">
            “{t.quote}”
          </blockquote>
          <figcaption className="mt-5 flex items-center gap-3 border-t border-forest-50 pt-4">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-forest-100 text-sm font-extrabold text-forest-800">
              {t.name.charAt(0)}
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-bold text-charcoal">{t.name}</span>
              <span className="block truncate text-[11px] text-graymute">{t.meta}</span>
            </span>
          </figcaption>
        </motion.figure>
      ))}
    </div>
  );
}
