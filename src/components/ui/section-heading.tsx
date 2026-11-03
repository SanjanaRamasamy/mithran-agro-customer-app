"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface SectionHeadingProps {
  title: string;
  subtitle?: string;
  viewAllHref?: string;
  viewAllLabel?: string;
  className?: string;
  eyebrow?: string;
}

/** Consistent section header with optional "View all" affordance. */
export function SectionHeading({
  title,
  subtitle,
  viewAllHref,
  viewAllLabel = "View all",
  className,
  eyebrow,
}: SectionHeadingProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className={cn("mb-5 flex items-end justify-between gap-4", className)}
    >
      <div className="min-w-0">
        {eyebrow && (
          <p className="mb-1 text-xs font-bold uppercase tracking-widest text-forest-600">{eyebrow}</p>
        )}
        <h2 className="truncate text-xl font-bold text-charcoal sm:text-2xl">{title}</h2>
        {subtitle && <p className="mt-1 hidden text-sm text-graymute sm:block">{subtitle}</p>}
      </div>
      {viewAllHref && (
        <Link
          href={viewAllHref}
          className="group inline-flex shrink-0 items-center gap-1 rounded-lg px-2 py-1.5 text-sm font-semibold text-forest-700 transition hover:text-forest-900"
        >
          {viewAllLabel}
          <ArrowRight
            className="size-4 transition-transform group-hover:translate-x-0.5"
            aria-hidden
          />
        </Link>
      )}
    </motion.div>
  );
}
