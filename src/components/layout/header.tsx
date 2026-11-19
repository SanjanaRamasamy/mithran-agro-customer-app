"use client";

import Link from "next/link";
import { Menu, X, ChevronDown, Home, LayoutGrid, BadgePercent, Tractor, Phone } from "lucide-react";
import { AgroBrandMark } from "@/components/ui/brand-mark";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { SITE, ACCOUNT_LINKS } from "@/config/site";
import { CATEGORY_GROUPS, CATEGORY_BY_ID } from "@/data/categories";
import { MegaMenu } from "./mega-menu";
import { cn } from "@/lib/utils";
import { useScrolled } from "@/hooks/useHydrated";
import { LocationSelector } from "./location-selector";
import { SearchBar } from "./search-bar";
import {
  AccountMenu,
  CartLink,
  NotificationsBell,
  WishlistLink,
} from "./header-widgets";

export function Header() {
  const scrolled = useScrolled(10);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40">
      <div
        className={cn(
          "border-b transition-all duration-300",
          scrolled ? "glass-strong border-white/60" : "border-transparent bg-warm/80 backdrop-blur-md"
        )}
      >
        {/* Row 1: logo · location · search · actions */}
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 sm:gap-4 lg:px-6">
          <button
            className="flex size-10 items-center justify-center rounded-xl text-charcoal transition hover:bg-forest-50 lg:hidden"
            onClick={() => setMobileMenuOpen((v) => !v)}
            aria-expanded={mobileMenuOpen}
            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
          >
            {mobileMenuOpen ? <X className="size-5" aria-hidden /> : <Menu className="size-5" aria-hidden />}
          </button>

          <Link href="/" className="flex shrink-0 items-center" aria-label={`${SITE.name} home`}>
            <AgroBrandMark />
          </Link>

          <div className="hidden md:block">
            <LocationSelector />
          </div>

          <div className="mx-auto hidden w-full max-w-xl lg:block">
            <SearchBar />
          </div>

          <div className="ml-auto flex items-center gap-0.5 sm:gap-1">
            <NotificationsBell />
            <WishlistLink />
            <CartLink />
            <div className="ml-1 hidden sm:block">
              <AccountMenu />
            </div>
          </div>
        </div>

        {/* Row 2: mobile search */}
        <div className="border-t border-forest-50/60 px-4 pb-3 pt-2 lg:hidden">
          <div className="mx-auto max-w-2xl md:hidden">
            <SearchBar />
          </div>
        </div>

        {/* Row 3: desktop mega-menu navigation */}
        <MegaMenu />
      </div>

      {/* Mobile drawer menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-forest-950/20 backdrop-blur-[2px] lg:hidden"
              onClick={() => setMobileMenuOpen(false)}
            />
            <motion.nav
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 380, damping: 34 }}
              className="glass-strong fixed inset-y-0 left-0 z-50 flex w-80 max-w-[85vw] flex-col overflow-y-auto rounded-r-3xl p-4 lg:hidden"
              aria-label="Mobile navigation"
            >
              <div className="flex items-center justify-between pb-3">
                <AgroBrandMark />
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  aria-label="Close menu"
                  className="rounded-lg p-2 text-graymute hover:bg-soft"
                >
                  <X className="size-5" aria-hidden />
                </button>
              </div>

              <LocationSelector className="mb-2 rounded-xl border border-forest-100 bg-white/70" />

              <p className="px-2 pb-1 pt-3 text-[10px] font-bold uppercase tracking-widest text-graymute">Marketplace</p>
              <ul className="space-y-0.5">
                <li>
                  <Link
                    href="/"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-charcoal transition hover:bg-forest-50"
                  >
                    <Home className="size-4 text-forest-700" aria-hidden />
                    Home
                  </Link>
                </li>
                <li>
                  <Link
                    href="/search"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-charcoal transition hover:bg-forest-50"
                  >
                    <LayoutGrid className="size-4 text-forest-700" aria-hidden />
                    Shop All Products
                  </Link>
                </li>
                <li>
                  <Link
                    href="/farms"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-charcoal transition hover:bg-forest-50"
                  >
                    <Tractor className="size-4 text-forest-700" aria-hidden />
                    Our Farms
                  </Link>
                </li>
                <li>
                  <Link
                    href="/contact"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-charcoal transition hover:bg-forest-50"
                  >
                    <Phone className="size-4 text-forest-700" aria-hidden />
                    Contact
                  </Link>
                </li>
              </ul>

              <p className="px-2 pb-1 pt-4 text-[10px] font-bold uppercase tracking-widest text-graymute">Departments</p>
              <div className="space-y-1">
                {CATEGORY_GROUPS.map((g) => {
                  const Icon = g.icon;
                  return (
                    <details key={g.id} className="group rounded-xl transition hover:bg-forest-50/70">
                      <summary className="flex cursor-pointer list-none items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-charcoal [&::-webkit-details-marker]:hidden">
                        <Icon className="size-4 shrink-0 text-forest-700" aria-hidden />
                        <span className="flex-1">{g.name}</span>
                        <ChevronDown className="size-4 text-graymute transition-transform group-open:rotate-180" aria-hidden />
                      </summary>
                      <div className="border-l border-forest-100 ml-5 flex flex-col py-1 pl-3">
                        <Link
                          href={`/category/${g.slug}`}
                          onClick={() => setMobileMenuOpen(false)}
                          className="rounded-lg px-2 py-1.5 text-[13px] font-bold text-forest-800 transition hover:bg-forest-50"
                        >
                          Shop all {g.name}
                        </Link>
                        {g.categoryIds.map((catId) => {
                          const cat = CATEGORY_BY_ID[catId];
                          if (!cat) return null;
                          return (
                            <div key={cat.id}>
                              <Link
                                href={`/category/${cat.slug}`}
                                onClick={() => setMobileMenuOpen(false)}
                                className="rounded-lg px-2 py-1.5 text-[13px] font-medium text-charcoal transition hover:bg-forest-50"
                              >
                                {cat.name}
                              </Link>
                              {cat.childIds && (
                                <div className="ml-3 flex flex-col border-l border-forest-100 pl-2">
                                  {cat.childIds.map((childId) => {
                                    const child = CATEGORY_BY_ID[childId];
                                    if (!child) return null;
                                    return (
                                      <Link
                                        key={child.id}
                                        href={`/category/${child.slug}`}
                                        onClick={() => setMobileMenuOpen(false)}
                                        className="rounded-lg px-2 py-1 text-xs text-charcoal/75 transition hover:text-forest-800"
                                      >
                                        {child.name}
                                      </Link>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </details>
                  );
                })}
              </div>

              <Link
                href="/search?onsale=1"
                onClick={() => setMobileMenuOpen(false)}
                className="mt-3 flex items-center justify-center gap-2 rounded-xl bg-lime-soft px-3 py-2.5 text-sm font-bold text-lime-deep transition hover:brightness-95"
              >
                <BadgePercent className="size-4" aria-hidden />
                Today’s Offers
              </Link>

              <p className="px-2 pb-1 pt-4 text-[10px] font-bold uppercase tracking-widest text-graymute">Account</p>
              <ul className="space-y-0.5">
                {ACCOUNT_LINKS.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-charcoal transition hover:bg-forest-50"
                    >
                      <link.icon className="size-4 text-forest-700" aria-hidden />
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>

              <div className="mt-auto border-t border-forest-50 pt-3">
                <AccountMenu />
              </div>
            </motion.nav>
          </>
        )}
      </AnimatePresence>
    </header>
  );
}
