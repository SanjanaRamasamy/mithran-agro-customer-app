"use client";

import type { LucideIcon } from "lucide-react";
import {
  CATEGORY_BY_ID,
  CATEGORY_GROUP_BY_ID,
  PRIMARY_TAB_CATEGORIES,
} from "@/data/categories";
import { cn } from "@/lib/utils";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { useCatalog } from "@/contexts/CatalogContext";

interface CategoryTabsProps {
  active: string | null;
  onChange: (slug: string | null) => void;
}

interface TabDef {
  slug: string;
  name: string;
  icon: LucideIcon;
  count: number;
}

/**
 * Horizontal pill tabs (mobile-first) for the primary marketplace
 * categories & departments. Clicking the active pill deselects it;
 * "All Products" clears every category filter. Counts are live.
 */
export function CategoryTabs({ active, onChange }: CategoryTabsProps) {
  const { categories, products } = useCatalog();
  const cats = PRIMARY_TAB_CATEGORIES.flatMap((id): TabDef[] => {
    const cat = CATEGORY_BY_ID[id];
    if (cat) {
      const liveCategory = categories.find((category) => category.slug === cat.slug);
      if (!liveCategory) return [];
      return [{
        slug: liveCategory.slug,
        name: liveCategory.name,
        icon: cat.icon,
        count: products.filter((product) => product.prestaShop?.categorySlugs.includes(liveCategory.slug)).length,
      }];
    }
    const group = CATEGORY_GROUP_BY_ID[id];
    if (group) {
      const Icon = group.icon;
      const liveCategory = categories.find((category) => category.slug === group.slug);
      if (!liveCategory) return [];
      return [{
        slug: liveCategory.slug,
        name: liveCategory.name,
        icon: Icon,
        count: products.filter((product) => product.prestaShop?.categorySlugs.includes(liveCategory.slug)).length,
      }];
    }
    return [];
  });

  return (
    <ScrollArea className="w-full whitespace-nowrap">
      <div className="flex gap-2 pb-1" role="tablist" aria-label="Product categories">
        <button
          role="tab"
          aria-selected={active === null}
          onClick={() => onChange(null)}
          className={cn(
            "rounded-full border px-4 py-2 text-sm font-semibold transition active:scale-95",
            active === null
              ? "border-forest-900 bg-forest-900 text-white shadow-soft"
              : "border-forest-100 bg-white/80 text-charcoal hover:border-forest-300"
          )}
        >
          All Products
        </button>

        {cats.map((c) => {
          const Icon = c.icon;
          const isActive = active === c.slug;
          return (
            <button
              key={c.slug}
              role="tab"
              aria-selected={isActive}
              onClick={() => onChange(isActive ? null : c.slug)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-semibold transition active:scale-95",
                isActive
                  ? "border-forest-900 bg-forest-900 text-white shadow-soft"
                  : "border-forest-100 bg-white/80 text-charcoal hover:border-forest-300"
              )}
            >
              <Icon className="size-3.5" aria-hidden />
              {c.name}
              <span
                className={cn(
                  "rounded-full px-1.5 text-[10px] font-bold",
                  isActive ? "bg-white/15 text-white" : "bg-forest-50 text-forest-700"
                )}
              >
                {c.count}
              </span>
            </button>
          );
        })}
      </div>
      <ScrollBar orientation="horizontal" className="invisible" />
    </ScrollArea>
  );
}
