"use client";

import { cn } from "@/lib/utils";
import { FiltersBody } from "./filter-body";
import type { FilterState } from "@/types";

/** Desktop sticky glass sidebar with all filter controls. */
export function FiltersPanel({
  filters,
  onChange,
  resultCount,
  className,
}: {
  filters: FilterState;
  onChange: (f: FilterState) => void;
  resultCount: number;
  className?: string;
}) {
  return (
    <aside className={cn("hidden w-64 shrink-0 lg:block", className)} aria-label="Product filters">
      <div className="glass sticky top-40 max-h-[calc(100vh-11rem)] overflow-y-auto rounded-2xl p-4">
        <FiltersBody filters={filters} onChange={onChange} resultCount={resultCount} />
      </div>
    </aside>
  );
}
