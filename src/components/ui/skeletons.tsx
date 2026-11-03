import { cn } from "@/lib/utils";

/** Shimmering product-card skeleton used on home rails, grid loading and PDP. */
export function ProductCardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("flex flex-col overflow-hidden rounded-2xl border border-forest-50 bg-white", className)}>
      <div className="shimmer aspect-square w-full" />
      <div className="space-y-2.5 p-4">
        <div className="shimmer h-3 w-1/3 rounded-full" />
        <div className="shimmer h-4 w-4/5 rounded-full" />
        <div className="shimmer h-3 w-1/2 rounded-full" />
        <div className="flex items-center justify-between pt-2">
          <div className="shimmer h-5 w-20 rounded-full" />
          <div className="shimmer size-9 rounded-xl" />
        </div>
      </div>
    </div>
  );
}

export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4" aria-busy="true" aria-label="Loading products">
      {Array.from({ length: count }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function RailSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="flex gap-4 overflow-hidden" aria-busy="true" aria-label="Loading products">
      {Array.from({ length: count }).map((_, i) => (
        <ProductCardSkeleton key={i} className="w-44 shrink-0 sm:w-52" />
      ))}
    </div>
  );
}

export function DetailSkeleton() {
  return (
    <div className="mx-auto grid max-w-6xl gap-8 px-4 py-8 md:grid-cols-2" aria-busy="true" aria-label="Loading product">
      <div className="shimmer aspect-square rounded-2xl" />
      <div className="space-y-4">
        <div className="shimmer h-4 w-24 rounded-full" />
        <div className="shimmer h-9 w-3/4 rounded-xl" />
        <div className="shimmer h-4 w-1/2 rounded-full" />
        <div className="shimmer h-8 w-32 rounded-full" />
        <div className="shimmer h-24 w-full rounded-2xl" />
        <div className="shimmer h-12 w-full rounded-xl" />
      </div>
    </div>
  );
}
