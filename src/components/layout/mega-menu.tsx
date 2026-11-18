"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useCatalog } from "@/contexts/CatalogContext";
import { cn } from "@/lib/utils";

/**
 * Desktop primary navigation — every top-level Mithran Agro business line
 * is a direct, consistent navigation link.
 */
export function MegaMenu() {
  const { products } = useCatalog();
  const pathname = usePathname();
  const params = useSearchParams();
  const hasDiscounts = products.some((product) => product.variants.some((variant) => variant.mrp > variant.price));

  return (
    <nav aria-label="Primary" className="hidden border-t border-forest-50/60 lg:block">
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
          <NavLink
            href="/category/women"
            label="Women's Apparels"
            active={
              pathname === "/category/women" ||
              pathname.startsWith("/category/sarees") ||
              pathname.startsWith("/category/kurti")
            }
          />
          {hasDiscounts && <NavLink href="/search?onsale=1" label="Offers" active={params.get("onsale") === "1"} />}
          <NavLink href="/farms" label="Our Farms" active={pathname === "/farms" || pathname.startsWith("/farms/")} />
          <NavLink href="/contact" label="Contact" active={pathname === "/contact"} />
        </div>
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
          : "text-charcoal/80 hover:bg-forest-50 hover:text-forest-900",
      )}
    >
      {label}
    </Link>
  );
}
