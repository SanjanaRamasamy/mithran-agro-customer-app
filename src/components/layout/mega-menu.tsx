"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, BadgePercent } from "lucide-react";
import { CATEGORY_BY_ID } from "@/data/categories";
import { PRODUCTS } from "@/data/products";
import { SmartImage } from "@/components/ui/smart-image";
import { getLowestVariantPrice } from "@/utils/product";
import { formatPrice } from "@/utils/format";
import { cn } from "@/lib/utils";

const WOMEN_CHILDREN = CATEGORY_BY_ID["women"]?.childIds ?? [];

function useFeaturedWomen() {
  return useMemo(() => {
    const ids = new Set(["women", ...WOMEN_CHILDREN]);
    return PRODUCTS.filter((p) => ids.has(p.categoryId))
      .sort((a, b) => b.rating - a.rating)
      .slice(0, 3);
  }, []);
}

/**
 * Desktop primary navigation — exactly the Mithren Agro business lines.
 * "Women's Apparels" opens a mega menu with its subcategories, top-rated
 * picks and a promo card; every other item is a direct link.
 */
export function MegaMenu() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [open, setOpen] = useState(false);
  const closeTimer = useRef<number | null>(null);

  const openNow = () => {
    if (closeTimer.current) window.clearTimeout(closeTimer.current);
    setOpen(true);
  };
  const scheduleClose = () => {
    if (closeTimer.current) window.clearTimeout(closeTimer.current);
    closeTimer.current = window.setTimeout(() => setOpen(false), 120);
  };
  const closeNow = () => {
    if (closeTimer.current) window.clearTimeout(closeTimer.current);
    setOpen(false);
  };

  /* close on Escape */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeNow();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const featuredWomen = useFeaturedWomen();

  return (
    <nav aria-label="Primary" className="hidden border-t border-forest-50/60 lg:block" onMouseLeave={scheduleClose}>
      <div className="relative mx-auto max-w-7xl px-6">
        <div className="flex h-11 items-center gap-0.5">
          <NavLink href="/" label="Home" active={pathname === "/"} />
          <NavLink
            href="/category/fruits"
            label="Fresh Fruits"
            active={pathname === "/category/fruits" || params.get("category") === "fruits"}
          />
          <NavLink
            href="/category/vegetables"
            label="Fresh Vegetables"
            active={pathname === "/category/vegetables" || params.get("category") === "vegetables"}
          />
          <NavLink
            href="/category/organic-fertilizers"
            label="Organic Fertilizers"
            active={pathname === "/category/organic-fertilizers" || params.get("category") === "organic-fertilizers"}
          />
          <NavLink
            href="/category/organic-grocery"
            label="Organic Groceries"
            active={pathname === "/category/organic-grocery" || params.get("category") === "organic-grocery"}
          />

          {/* mega menu trigger */}
          <button
            aria-expanded={open}
            aria-haspopup="true"
            onMouseEnter={openNow}
            onFocus={openNow}
            onClick={() => {
              closeNow();
              router.push("/category/women");
            }}
            className={cn(
              "inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-lg px-2 py-1.5 text-[13px] font-semibold transition",
              open || pathname === "/category/women" || pathname.startsWith("/category/sarees") || pathname.startsWith("/category/kurti")
                ? "bg-forest-50 text-forest-900"
                : "text-charcoal/80 hover:bg-forest-50 hover:text-forest-900"
            )}
          >
            Women&apos;s Apparels
            <ChevronDown
              className={cn("size-3 transition-transform duration-200", open && "rotate-180")}
              aria-hidden
            />
          </button>

          <NavLink href="/search?onsale=1" label="Offers" active={params.get("onsale") === "1"} />
          <NavLink href="/farms" label="Our Farms" active={pathname === "/farms"} />
          <NavLink href="/contact" label="Contact" active={pathname === "/contact"} />

          <span className="ml-auto hidden shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full bg-lime-soft px-3 py-1 text-xs font-bold text-lime-deep 2xl:inline-flex">
            <BadgePercent className="size-3.5" aria-hidden />
            Farm-fresh deals daily
          </span>
        </div>

        {/* ------------------------- mega panel ------------------------- */}
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 4 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
              className="absolute inset-x-0 top-full z-50"
              onMouseEnter={openNow}
            >
              <div className="glass-strong mx-auto max-w-5xl overflow-hidden rounded-2xl border border-forest-100 shadow-lift">
                <div className="flex gap-6 p-6">
                  {/* subcategories */}
                  <div className="grid flex-1 grid-cols-3 gap-x-6 gap-y-1">
                    {WOMEN_CHILDREN.map((childId, i) => {
                      const cat = CATEGORY_BY_ID[childId];
                      if (!cat) return null;
                      const Icon = cat.icon;
                      return (
                        <motion.div
                          key={cat.id}
                          initial={{ opacity: 0, x: -6 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.03 * i, duration: 0.18 }}
                        >
                          <Link
                            href={`/category/${cat.slug}`}
                            onClick={closeNow}
                            className="group flex items-center gap-2.5 rounded-lg py-1.5 pr-2 transition hover:bg-soft"
                          >
                            <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-forest-50 text-forest-800 transition group-hover:bg-forest-100">
                              <Icon className="size-3.5" aria-hidden />
                            </span>
                            <span className="min-w-0">
                              <span className="block truncate text-[13px] font-bold text-charcoal group-hover:text-forest-800">
                                {cat.name}
                              </span>
                              <span className="block text-[10px] text-graymute">
                                {cat.itemCount} styles
                              </span>
                            </span>
                          </Link>
                        </motion.div>
                      );
                    })}
                  </div>

                  {/* featured products */}
                  <div className="hidden w-48 shrink-0 flex-col gap-2 xl:flex">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-graymute">
                      Top rated
                    </p>
                    {featuredWomen.map((p) => (
                      <Link
                        key={p.id}
                        href={`/products/${p.slug}`}
                        onClick={closeNow}
                        className="group flex items-center gap-2.5 rounded-xl p-1.5 transition hover:bg-soft"
                      >
                        <SmartImage
                          src={p.images[0] ?? ""}
                          alt={p.name}
                          emojiSeed={p.name}
                          rounded="rounded-lg"
                          className="size-11 shrink-0"
                          sizes="44px"
                        />
                        <span className="min-w-0">
                          <span className="block truncate text-xs font-bold text-charcoal group-hover:text-forest-800">
                            {p.name}
                          </span>
                          <span className="text-[11px] font-semibold text-forest-800">
                            {formatPrice(getLowestVariantPrice(p).price)}
                          </span>
                        </span>
                      </Link>
                    ))}
                  </div>

                  {/* promo card */}
                  <Link
                    href="/category/women"
                    onClick={closeNow}
                    className="group relative hidden w-52 shrink-0 overflow-hidden rounded-xl lg:block"
                  >
                    <Image
                      src={CATEGORY_BY_ID["women"]?.image || ""}
                      alt=""
                      fill
                      sizes="220px"
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-forest-950/85 via-forest-950/25 to-transparent" />
                    <div className="absolute inset-x-3 bottom-3 text-white">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-lime-natural">
                        Woven by artisan clusters
                      </p>
                      <p className="mt-0.5 text-sm font-extrabold leading-snug">
                        Shop Women&apos;s Apparels
                      </p>
                    </div>
                  </Link>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </nav>
  );
}

function NavLink({
  href,
  active,
  label,
}: {
  href: string;
  active: boolean;
  label: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg px-2 py-1.5 text-[13px] font-semibold transition",
        active
          ? "bg-forest-50 text-forest-900"
          : "text-charcoal/80 hover:bg-forest-50 hover:text-forest-900"
      )}
    >
      {label}
    </Link>
  );
}
