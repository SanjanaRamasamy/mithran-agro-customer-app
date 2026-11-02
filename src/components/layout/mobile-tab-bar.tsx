"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Grid3X3, Heart, ShoppingBasket, Package } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { cn } from "@/lib/utils";

const TABS = [
  { href: "/", label: "Home", icon: Home },
  { href: "/search", label: "Shop", icon: Grid3X3 },
  { href: "/wishlist", label: "Wishlist", icon: Heart },
  { href: "/orders", label: "Orders", icon: Package },
  { href: "/cart", label: "Basket", icon: ShoppingBasket },
];

/** Bottom tab bar for mobile — glass, with live basket badge. */
export function MobileTabBar() {
  const pathname = usePathname();
  const { itemCount } = useCart();

  if (pathname.startsWith("/checkout")) return null;

  return (
    <nav
      aria-label="Mobile navigation"
      className="glass-strong fixed inset-x-3 bottom-3 z-40 flex items-center justify-between rounded-2xl px-2 py-1.5 md:hidden"
    >
      {TABS.map(({ href, label, icon: Icon }) => {
        const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            aria-label={label}
            aria-current={active ? "page" : undefined}
            className={cn(
              "relative flex min-w-14 flex-col items-center gap-0.5 rounded-xl px-2 py-1.5 transition",
              active ? "text-forest-900" : "text-graymute hover:text-charcoal"
            )}
          >
            <span className="relative">
              <Icon className="size-5" aria-hidden />
              {href === "/cart" && itemCount > 0 && (
                <span className="absolute -right-2 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-lime-natural px-1 text-[9px] font-bold text-forest-950">
                  {itemCount}
                </span>
              )}
            </span>
            <span className="text-[10px] font-semibold">{label}</span>
            {active && (
              <span className="absolute -bottom-0.5 h-1 w-6 rounded-full bg-forest-800" aria-hidden />
            )}
          </Link>
        );
      })}
    </nav>
  );
}
