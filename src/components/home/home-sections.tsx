"use client";

import { motion } from "framer-motion";
import { BadgeCheck, Leaf, ShieldCheck, Truck } from "lucide-react";
import { TRUST_POINTS } from "@/constants";

const TRUST_ICONS = [BadgeCheck, Truck, Leaf, ShieldCheck] as const;

/** "Why choose Agro" — the four brand promises. */
export function TrustSection() {
  return (
    <section id="why-agro" aria-label="Why choose Agro" className="scroll-mt-24 rounded-3xl bg-forest-900 p-6 text-white sm:p-10">
      <div className="mb-8 max-w-lg">
        <p className="text-xs font-bold uppercase tracking-widest text-lime-natural">The Agro promise</p>
        <h2 className="mt-1.5 text-2xl font-extrabold tracking-tight sm:text-3xl">
          Why choose Agro.
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-white/70">
          One marketplace for your kitchen, your garden and your wardrobe — run on farm-direct
          relationships, not middlemen.
        </p>
      </div>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {TRUST_POINTS.map((point, i) => {
          const Icon = TRUST_ICONS[i] ?? BadgeCheck;
          return (
            <motion.div
              key={point.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
              className="rounded-2xl bg-white/[0.06] p-5 ring-1 ring-white/10 backdrop-blur-sm"
            >
              <span className="flex size-11 items-center justify-center rounded-2xl bg-lime-natural/15 text-lime-natural">
                <Icon className="size-5" aria-hidden />
              </span>
              <h3 className="mt-4 text-sm font-bold">{point.title}</h3>
              <p className="mt-1.5 text-xs leading-relaxed text-white/70">{point.description}</p>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
