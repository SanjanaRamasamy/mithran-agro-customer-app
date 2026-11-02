"use client";

import { RotateCcw, Star } from "lucide-react";
import type { FilterState } from "@/types";
import { CATEGORY_GROUPS, CATEGORY_BY_ID, expandCategoryIds, effectiveItemCount } from "@/data/categories";
import { SELLERS } from "@/data/sellers";
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
 * Shared filter controls — Category, Price, Availability, Rating and
 * Seller only, matching the Mithren Agro catalogue.
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
  const toggleArrayValue = (key: "categories" | "sellers", value: string) => {
    const list = filters[key];
    onChange({
      ...filters,
      [key]: list.includes(value) ? list.filter((x) => x !== value) : [...list, value],
    });
  };

  const expandedSelected = expandCategoryIds(filters.categories);

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
          {CATEGORY_GROUPS.map((g) => {
            const GroupIcon = g.icon;
            const deptSelected = g.categoryIds.some((id) => filters.categories.includes(id));
            const deptCount = g.categoryIds.reduce(
              (sum, id) => sum + effectiveItemCount(CATEGORY_BY_ID[id]),
              0
            );
            return (
              <div key={g.id}>
                <button
                  onClick={() => toggleArrayValue("categories", g.id)}
                  aria-pressed={deptSelected}
                  className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left transition hover:bg-soft"
                >
                  <GroupIcon className="size-3.5 text-forest-700" aria-hidden />
                  <span className="flex-1 text-[11px] font-bold uppercase tracking-wider text-charcoal">
                    {g.name}
                  </span>
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-[10px] font-bold transition",
                      deptSelected ? "bg-forest-900 text-white" : "bg-forest-50 text-forest-700"
                    )}
                  >
                    {deptCount}
                  </span>
                </button>
                <div>
                  {g.categoryIds.map((catId) => {
                    const cat = CATEGORY_BY_ID[catId];
                    if (!cat) return null;
                    const hasChildren = Boolean(cat.childIds?.length);
                    return (
                      <div key={cat.id}>
                        <CheckRow
                          label={cat.name}
                          count={effectiveItemCount(cat)}
                          checked={filters.categories.includes(cat.id)}
                          onToggle={() => toggleArrayValue("categories", cat.id)}
                        />
                        {hasChildren &&
                          cat.childIds!.map((childId) => {
                            const child = CATEGORY_BY_ID[childId];
                            if (!child) return null;
                            return (
                              <CheckRow
                                key={child.id}
                                label={child.name}
                                count={child.itemCount}
                                checked={expandedSelected.includes(child.id) && filters.categories.includes(child.id)}
                                indented
                                onToggle={() => toggleArrayValue("categories", child.id)}
                              />
                            );
                          })}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
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

      {/* Rating */}
      <section aria-label="Filter by rating">
        <SectionLabel>Rating</SectionLabel>
        <div className="flex flex-wrap gap-2 px-2.5">
          {[4.5, 4, 3.5].map((r) => (
            <button
              key={r}
              onClick={() => onChange({ ...filters, minRating: filters.minRating === r ? null : r })}
              aria-pressed={filters.minRating === r}
              className={cn(
                "inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-xs font-bold transition",
                filters.minRating === r
                  ? "border-forest-800 bg-forest-900 text-white"
                  : "border-forest-100 bg-white text-charcoal hover:border-forest-300"
              )}
            >
              <Star
                className={cn("size-3.5", filters.minRating === r ? "fill-white" : "fill-amber-400 text-amber-400")}
                aria-hidden
              />
              {r}+
            </button>
          ))}
        </div>
      </section>

      {/* Seller */}
      <section aria-label="Filter by seller">
        <SectionLabel>Seller</SectionLabel>
        <div className="max-h-44 space-y-0.5 overflow-y-auto pr-1">
          {SELLERS.map((s) => (
            <CheckRow
              key={s.id}
              label={s.farmName}
              count={undefined}
              checked={filters.sellers.includes(s.id)}
              onToggle={() => toggleArrayValue("sellers", s.id)}
            />
          ))}
        </div>
      </section>
    </div>
  );
}
