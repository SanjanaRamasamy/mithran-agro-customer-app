"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Megaphone, X } from "lucide-react";
import { ANNOUNCEMENTS } from "@/constants";

/** Slim top ticker with rotating announcements. Dismissible. */
export function AnnouncementBar() {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ height: 0, opacity: 0 }}
        animate={{ height: "auto", opacity: 1 }}
        exit={{ height: 0, opacity: 0 }}
        className="overflow-hidden bg-forest-900 text-white"
        role="region"
        aria-label="Announcements"
      >
        <div className="relative mx-auto flex max-w-7xl items-center justify-center gap-3 px-4 py-2">
          <Megaphone className="size-3.5 shrink-0 text-lime-natural" aria-hidden />
          <div className="relative h-5 flex-1 overflow-hidden sm:flex-none sm:w-[480px]">
            <div className="animate-ticker absolute inset-0 flex w-max items-center gap-12 whitespace-nowrap">
              {[...ANNOUNCEMENTS, ...ANNOUNCEMENTS].map((a, i) => (
                <span key={i} className="text-xs font-medium tracking-wide text-forest-50">
                  {a}
                </span>
              ))}
            </div>
          </div>
          <button
            onClick={() => setDismissed(true)}
            aria-label="Dismiss announcements"
            className="absolute right-3 rounded-md p-1 text-forest-100 transition hover:bg-forest-800"
          >
            <X className="size-3.5" aria-hidden />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
