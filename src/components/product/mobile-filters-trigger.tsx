"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { SlidersHorizontal, X } from "lucide-react";
import type { FilterState } from "@/types";
import { FiltersBody } from "./filter-body";

/** Mobile trigger button + glass bottom-sheet with the shared filter body. */
export function MobileFiltersTrigger({
  filters,
  onChange,
  resultCount,
}: {
  filters: FilterState;
  onChange: (f: FilterState) => void;
  resultCount: number;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="glass inline-flex h-11 items-center gap-2 rounded-xl px-4 text-sm font-bold text-charcoal active:scale-95 lg:hidden"
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        <SlidersHorizontal className="size-4" aria-hidden />
        Filters
        <span className="rounded-full bg-forest-900 px-1.5 py-0.5 text-[10px] font-bold text-white">
          {resultCount}
        </span>
      </button>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[60] bg-forest-950/25 backdrop-blur-[2px] lg:hidden"
              onClick={() => setOpen(false)}
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 340, damping: 34 }}
              className="glass-strong fixed inset-x-0 bottom-0 z-[61] max-h-[82vh] overflow-y-auto rounded-t-3xl p-5 pb-8 lg:hidden"
              role="dialog"
              aria-modal="true"
              aria-label="Product filters"
            >
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-base font-bold text-charcoal">Filters</h2>
                <button
                  onClick={() => setOpen(false)}
                  aria-label="Close filters"
                  className="flex size-9 items-center justify-center rounded-xl text-graymute transition hover:bg-soft"
                >
                  <X className="size-5" aria-hidden />
                </button>
              </div>
              <FiltersBody filters={filters} onChange={onChange} resultCount={resultCount} />
              <button
                onClick={() => setOpen(false)}
                className="mt-6 h-12 w-full rounded-2xl bg-forest-900 text-sm font-bold text-white transition active:scale-[0.98]"
              >
                Show {resultCount} {resultCount === 1 ? "result" : "results"}
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
