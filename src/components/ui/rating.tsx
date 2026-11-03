"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface RatingProps {
  value: number;
  count?: number;
  size?: "sm" | "md" | "lg";
  showValue?: boolean;
  interactive?: boolean;
  onChange?: (value: number) => void;
  className?: string;
}

const SIZES = { sm: "size-3.5", md: "size-4", lg: "size-5" } as const;

export function Rating({
  value,
  count,
  size = "sm",
  showValue = true,
  interactive = false,
  onChange,
  className,
}: RatingProps) {
  const [hover, setHover] = useState<number | null>(null);
  const display = hover ?? value;

  return (
    <div className={cn("flex items-center gap-1.5", className)}>
      <div
        className="flex items-center gap-0.5"
        role={interactive ? "radiogroup" : "img"}
        aria-label={interactive ? "Select a rating" : `Rated ${value.toFixed(1)} out of 5`}
        onMouseLeave={() => interactive && setHover(null)}
      >
        {[1, 2, 3, 4, 5].map((star) => {
          const filled = star <= Math.round(display);
          const half = !filled && star - 0.5 <= display;
          if (interactive) {
            return (
              <button
                key={star}
                type="button"
                role="radio"
                aria-checked={value === star}
                aria-label={`${star} star${star > 1 ? "s" : ""}`}
                onMouseEnter={() => setHover(star)}
                onFocus={() => setHover(star)}
                onClick={() => onChange?.(star)}
                className="rounded-sm p-0.5 transition-transform hover:scale-110 focus-visible:outline-2"
              >
                <Star
                  className={cn(
                    SIZES[size],
                    filled ? "fill-amber-400 text-amber-400" : "fill-transparent text-forest-300"
                  )}
                  strokeWidth={1.5}
                />
              </button>
            );
          }
          return (
            <Star
              key={star}
              className={cn(
                SIZES[size],
                filled
                  ? "fill-amber-400 text-amber-400"
                  : half
                    ? "fill-amber-400/50 text-amber-400"
                    : "fill-forest-100 text-forest-200"
              )}
              strokeWidth={1.5}
              aria-hidden
            />
          );
        })}
      </div>
      {showValue && (
        <span className="text-xs font-medium text-graymute">
          {value.toFixed(1)}
          {typeof count === "number" && (
            <span className="text-graymute/80"> ({count.toLocaleString("en-IN")})</span>
          )}
        </span>
      )}
    </div>
  );
}

interface RatingBarProps {
  star: number;
  percent: number;
  count?: number;
}

export function RatingBar({ star, percent, count }: RatingBarProps) {
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="flex w-8 items-center gap-0.5 font-medium text-charcoal">
        {star} <Star className="size-3 fill-amber-400 text-amber-400" aria-hidden />
      </span>
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-soft">
        <div
          className="h-full rounded-full bg-amber-400 transition-all duration-500"
          style={{ width: `${percent}%` }}
          role="progressbar"
          aria-valuenow={percent}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`${star} star ratings`}
        />
      </div>
      <span className="w-12 text-right tabular-nums text-graymute">
        {count !== undefined ? count.toLocaleString("en-IN") : `${percent}%`}
      </span>
    </div>
  );
}
