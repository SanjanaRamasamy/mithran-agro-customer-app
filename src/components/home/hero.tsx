"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Play, Sprout, Truck } from "lucide-react";
import { SmartImage } from "@/components/ui/smart-image";
import { cn } from "@/lib/utils";

const easeOut = [0.22, 1, 0.36, 1] as const;

/** Soft photographic leaf used as background decoration (like the reference). */
function DecorLeaf({ className, color = "#8cbf85" }: { className?: string; color?: string }) {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      aria-hidden
      className={cn("pointer-events-none absolute -z-[5]", className)}
    >
      <path d="M57 5 C 27 7 6 27 4 59 C 36 61 57 41 57 5 Z" fill={color} />
      <path
        d="M11 55 C 22 41 38 25 53 9"
        stroke="rgba(255,255,255,0.45)"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

/** Curved hand-drawn arrow under the annotation, pointing at the produce. */
function AnnotationArrow({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 110 88" fill="none" aria-hidden className={cn("text-forest-700", className)}>
      <path
        d="M12 6 C 58 18, 88 40, 83 74"
        stroke="currentColor"
        strokeWidth="3.2"
        strokeLinecap="round"
      />
      <path
        d="M70 62 L 83 77 L 92 60"
        stroke="currentColor"
        strokeWidth="3.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const AVATARS = [1, 2, 3, 4] as const;

/**
 * Reference-matched hero: airy cream-green full-bleed canvas, editorial
 * headline with green accent word, dual CTA, avatar social proof, and a
 * branded farm-crate photograph blended into the background with a
 * handwritten annotation and a floating same-day delivery glass chip.
 */
export function Hero() {
  return (
    <section
      aria-label="Agro — good food grows a better tomorrow"
      className="relative isolate w-full overflow-hidden"
    >
      {/* ---- background canvas ---- */}
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-gradient-to-b from-[#f7f8ef] via-[#f0f4e2] to-[#e6eed6]"
      />
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-[radial-gradient(58%_66%_at_26%_40%,rgba(255,255,255,0.92),transparent_70%)]"
      />
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-[radial-gradient(46%_58%_at_76%_46%,rgba(224,239,191,0.6),transparent_72%)]"
      />

      {/* ---- floating leaves ---- */}
      <DecorLeaf className="left-[1.5%] top-9 size-14 -rotate-[24deg] opacity-70 lg:size-20" />
      <DecorLeaf
        className="left-[5.5%] top-28 size-8 rotate-[38deg] opacity-55 blur-[1px] lg:size-10"
        color="#a5cf9a"
      />
      <DecorLeaf
        className="bottom-16 left-[3%] hidden size-16 rotate-[150deg] opacity-60 blur-[2px] lg:block xl:size-20"
        color="#7fb377"
      />
      <DecorLeaf
        className="right-[3%] top-16 hidden size-12 rotate-[105deg] opacity-60 sm:block lg:size-16"
        color="#9bc493"
      />
      <DecorLeaf
        className="bottom-24 right-[2.5%] hidden size-10 -rotate-[35deg] opacity-50 blur-[1.5px] lg:block"
        color="#a5cf9a"
      />
      <DecorLeaf
        className="left-[46%] top-5 size-6 rotate-[65deg] opacity-50 sm:size-8"
        color="#b4d8a8"
      />

      {/* ---- content ---- */}
      <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-8 px-4 pb-12 pt-9 sm:px-6 sm:pb-16 sm:pt-12 lg:grid-cols-[1.04fr_1fr] lg:gap-6 lg:pb-20 lg:pt-16">
        {/* left — copy */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: easeOut }}
          className="relative z-10 max-w-xl"
        >
          <span className="glass inline-flex items-center gap-2 rounded-full px-4 py-2 text-[13px] font-bold text-forest-900">
            <Sprout className="size-4 text-forest-600" aria-hidden />
            100% honestly-labelled produce
          </span>

          <h1 className="mt-5 text-[2.7rem] font-extrabold leading-[1.05] tracking-tight text-[#22271f] sm:text-6xl lg:text-[4.05rem]">
            Good Food
            <br />
            Grows a Better
            <br />
            <span className="text-forest-500">Tomorrow</span>
          </h1>

          <p className="mt-4 max-w-md text-[15px] leading-relaxed text-graymute sm:text-base">
            Shop directly from verified organic farmers and local greengrocers across the city.
          </p>

          <div className="mt-7 flex flex-wrap items-center gap-3">
            <Link
              href="/search?category=fresh-produce"
              className="group inline-flex h-12 items-center gap-2.5 rounded-full bg-forest-900 pl-7 pr-5 text-sm font-bold text-white shadow-lift transition hover:bg-forest-800 active:scale-[0.98]"
            >
              Shop Fresh Produce
              <span className="grid size-7 place-items-center rounded-full bg-white/15">
                <ArrowRight
                  className="size-4 transition-transform duration-300 group-hover:translate-x-0.5"
                  aria-hidden
                />
              </span>
            </Link>
            <Link
              href="/farms"
              className="glass inline-flex h-12 items-center gap-2.5 rounded-full px-6 text-sm font-bold text-forest-950 shadow-soft transition hover:bg-white/90 active:scale-[0.98]"
            >
              <span className="grid size-6 place-items-center rounded-full bg-forest-900 text-white">
                <Play className="size-3 fill-current" aria-hidden />
              </span>
              Meet Our Farmers
            </Link>
          </div>

          {/* social proof */}
          <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-3">
            <div className="flex -space-x-3">
              {AVATARS.map((n) => (
                <SmartImage
                  key={n}
                  src={`/images/avatar-${n}.png`}
                  alt="Happy Agro customer"
                  emojiSeed="farmer"
                  rounded="rounded-full"
                  className="size-10 shrink-0 rounded-full ring-2 ring-white"
                  sizes="40px"
                />
              ))}
            </div>
            <p className="text-sm font-semibold text-forest-950">
              <span className="font-extrabold">10,000+</span> happy families
            </p>
            <a
              href="#why-agro"
              className="group inline-flex items-center gap-2.5 text-sm font-bold text-forest-950 transition hover:text-forest-700"
            >
              <span className="grid size-9 place-items-center rounded-full bg-forest-900 text-white shadow-soft transition duration-300 group-hover:scale-105">
                <Play className="size-3.5 fill-current" aria-hidden />
              </span>
              Watch how it works
            </a>
          </div>
        </motion.div>

        {/* right — branded crate visual */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 14 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.7, ease: easeOut, delay: 0.12 }}
          className="relative z-10"
        >
          <div className="relative mx-auto aspect-[1024/585] w-full max-w-[620px] lg:max-w-none [mask-image:radial-gradient(74%_72%_at_50%_48%,#000_56%,transparent_79%)] [-webkit-mask-image:radial-gradient(74%_72%_at_50%_48%,#000_56%,transparent_79%)]">
            <SmartImage
              src="/images/hero-crate.jpg"
              alt="Wooden crate branded Agro Pvt. Ltd. overflowing with fresh organic vegetables"
              emojiSeed="basket"
              rounded="rounded-none"
              className="absolute inset-0 h-full w-full"
              priority
              sizes="(max-width: 1024px) 92vw, 46vw"
            />
          </div>

          {/* handwritten annotation */}
          <div
            aria-hidden
            className="absolute left-1 top-1 hidden -rotate-6 select-none sm:block lg:-left-5 lg:top-3"
          >
            <p className="font-serif text-[1.3rem] italic leading-[1.18] text-forest-800 lg:text-[1.55rem]">
              Farm Fresh
              <br />
              <span className="ml-7">Organic Produce</span>
            </p>
            <AnnotationArrow className="ml-10 mt-1 size-14 lg:size-[4.5rem]" />
          </div>

          {/* same-day glass chip */}
          <div className="glass animate-float-soft absolute right-0 top-1 flex items-center gap-3 rounded-2xl px-4 py-3 sm:-top-2 sm:right-1 lg:right-0">
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-lime-soft text-forest-700">
              <Truck className="size-5" aria-hidden />
            </span>
            <span className="leading-tight">
              <span className="block text-sm font-extrabold text-forest-950">Same-day</span>
              <span className="block text-xs font-semibold text-graymute">Fresh Produce</span>
            </span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
