"use client";

import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: { label: string; onClick?: () => void; href?: string };
  secondaryAction?: { label: string; onClick?: () => void; href?: string };
  className?: string;
}

import Link from "next/link";

/** Consistent, animated empty state used across cart, wishlist, orders, search. */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  secondaryAction,
  className,
}: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className={cn(
        "flex flex-col items-center justify-center rounded-2xl border border-dashed border-forest-100 bg-white/60 px-6 py-14 text-center",
        className
      )}
    >
      <div className="relative mb-5">
        <div className="absolute inset-0 -m-3 rounded-full bg-forest-50" aria-hidden />
        <div className="relative flex size-16 items-center justify-center rounded-full bg-gradient-to-br from-forest-50 to-lime-soft ring-1 ring-forest-100">
          <Icon className="size-7 text-forest-700" aria-hidden />
        </div>
      </div>
      <h3 className="text-lg font-bold text-charcoal">{title}</h3>
      <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-graymute">{description}</p>
      {(action || secondaryAction) && (
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          {action &&
            (action.href ? (
              <Link
                href={action.href}
                className="inline-flex h-11 items-center rounded-xl bg-forest-900 px-5 text-sm font-semibold text-white shadow-soft transition hover:bg-forest-800 active:scale-95"
              >
                {action.label}
              </Link>
            ) : (
              <button
                onClick={action.onClick}
                className="inline-flex h-11 items-center rounded-xl bg-forest-900 px-5 text-sm font-semibold text-white shadow-soft transition hover:bg-forest-800 active:scale-95"
              >
                {action.label}
              </button>
            ))}
          {secondaryAction &&
            (secondaryAction.href ? (
              <Link
                href={secondaryAction.href}
                className="inline-flex h-11 items-center rounded-xl border border-forest-200 bg-white px-5 text-sm font-semibold text-forest-800 transition hover:bg-forest-50 active:scale-95"
              >
                {secondaryAction.label}
              </Link>
            ) : (
              <button
                onClick={secondaryAction.onClick}
                className="inline-flex h-11 items-center rounded-xl border border-forest-200 bg-white px-5 text-sm font-semibold text-forest-800 transition hover:bg-forest-50 active:scale-95"
              >
                {secondaryAction.label}
              </button>
            ))}
        </div>
      )}
    </motion.div>
  );
}
