"use client";

import { RotateCcw } from "lucide-react";
import type { FilterState } from "@/types";
import { useCatalog } from "@/contexts/CatalogContext";
import { PRICE_BOUNDS } from "@/constants";
import { DEFAULT_FILTERS } from "@/hooks/useProductQuery";
import { cn } from "@/lib/utils";
import { Slider } from "@/components/ui/slider";
import { formatPrice } from "@/utils/format";

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-2.5 text-[11px] font-bold uppercase tracking-widest text-graymute">{children}</p>
  );
}

function CheckRow({
  label,
  count,
  checked,
  indented,
  onToggle,
}: {
  label: string;
  count?: number;
  checked: boolean;
  indented?: boolean;
  onToggle: () => void;
}) {
  return (
    <label
      className={cn(
        "flex cursor-pointer items-center justify-between gap-3 rounded-xl px-2.5 py-2 transition hover:bg-soft",
        checked && "bg-forest-50",
        indented && "ml-4"
      )}
    >
      <span className="flex min-w-0 items-center gap-2.5">
        <input
          type="checkbox"
          checked={checked}
          onChange={onToggle}
          className="size-4 shrink-0 rounded accent-forest-800"
        />
        <span className="truncate text-sm font-medium text-charcoal">{label}</span>
      </span>
      {typeof count === "number" && (
        <span className="shrink-0 rounded-full bg-soft px-2 py-0.5 text-[10px] font-bold text-graymute">
          {count}
        </span>
      )}
    </label>
  );
}

/**
 * Shared filters use live PrestaShop categories; unsupported seller and rating
 * facets are omitted until those records are available.
 */
export function FiltersBody({
  filters,
  onChange,
  resultCount,
}: {
  filters: FilterState;
  onChange: (f: FilterState) => void;
  resultCount: number;
}) {
  const { categories, products } = useCatalog();

  const toggleArrayValue = (key: "categories" | "sellers", value: string) => {
    const list = filters[key];
    onChange({
      ...filters,
      [key]: list.includes(value) ? list.filter((x) => x !== value) : [...list, value],
    });
  };

  const categoryCount = (id: string) =>
    products.filter((product) => product.prestaShop?.categoryAncestorIds.includes(id)).length;

  const renderCategory = (category: (typeof categories)[number], depth = 0): React.ReactNode => {
    const children = categories
      .filter((child) => child.active && child.parentId === category.id)
      .sort((left, right) => left.name.localeCompare(right.name));

    return (
      <div key={category.id}>
        <CheckRow
          label={category.name}
          count={categoryCount(category.id)}
          checked={filters.categories.includes(category.id)}
          indented={depth > 0}
          onToggle={() => toggleArrayValue("categories", category.id)}
        />
        {children.map((child) => renderCategory(child, depth + 1))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm font-bold text-charcoal">
          {resultCount} {resultCount === 1 ? "product" : "products"}
        </p>
        <button
          onClick={() => onChange({ ...DEFAULT_FILTERS, priceRange: [...PRICE_BOUNDS] as [number, number] })}
          className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-bold text-forest-700 transition hover:bg-forest-50"
        >
          <RotateCcw className="size-3.5" aria-hidden />
          Reset all
        </button>
      </div>

      {/* Category */}
      <section aria-label="Filter by category">
        <SectionLabel>Category</SectionLabel>
        <div className="space-y-1">
          {categories
            .filter((category) => category.active && category.level === 2)
            .sort((left, right) => left.name.localeCompare(right.name))
            .map((category) => renderCategory(category))}
        </div>
      </section>

      {/* Price */}
      <section aria-label="Filter by price">
        <SectionLabel>Price</SectionLabel>
        <div className="px-2.5 pb-1">
          <Slider
            value={filters.priceRange}
            min={PRICE_BOUNDS[0]}
            max={PRICE_BOUNDS[1]}
            step={50}
            onValueChange={(v: number[]) => onChange({ ...filters, priceRange: [v[0], v[1]] })}
            aria-label="Price range"
            className="my-2"
          />
          <div className="flex items-center justify-between text-xs font-semibold text-charcoal">
            <span className="rounded-lg bg-soft px-2 py-1">{formatPrice(filters.priceRange[0])}</span>
            <span className="text-graymute">to</span>
            <span className="rounded-lg bg-soft px-2 py-1">
              {filters.priceRange[1] >= PRICE_BOUNDS[1]
                ? `${formatPrice(PRICE_BOUNDS[1])}+`
                : formatPrice(filters.priceRange[1])}
            </span>
          </div>
        </div>
      </section>

      {/* Availability */}
      <section aria-label="Filter by availability">
        <SectionLabel>Availability</SectionLabel>
        <div className="flex gap-2 px-2.5">
          {(["all", "in-stock"] as const).map((a) => (
            <button
              key={a}
              onClick={() => onChange({ ...filters, availability: a })}
              aria-pressed={filters.availability === a}
              className={cn(
                "flex-1 rounded-xl border px-3 py-2 text-xs font-bold transition",
                filters.availability === a
                  ? "border-forest-800 bg-forest-900 text-white"
                  : "border-forest-100 bg-white text-charcoal hover:border-forest-300"
              )}
            >
              {a === "all" ? "All items" : "In stock only"}
            </button>
          ))}
        </div>
      </section>

    </div>
  );
}
