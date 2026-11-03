"use client";

import { Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface QuantityStepperProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  size?: "sm" | "md";
  className?: string;
  ariaLabel?: string;
}

/** Accessible + / − quantity control used on cards, cart rows and PDP. */
export function QuantityStepper({
  value,
  onChange,
  min = 1,
  max = 10,
  size = "md",
  className,
  ariaLabel = "Quantity",
}: QuantityStepperProps) {
  const btn =
    size === "sm"
      ? "size-7 rounded-lg"
      : "size-9 rounded-xl";
  const icon = size === "sm" ? "size-3.5" : "size-4";

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1 rounded-xl border border-forest-100 bg-white p-1 shadow-soft",
        className
      )}
      role="group"
      aria-label={ariaLabel}
    >
      <button
        type="button"
        onClick={() => onChange(Math.max(min, value - 1))}
        aria-label="Decrease quantity"
        disabled={value <= min}
        className={cn(
          btn,
          "flex items-center justify-center text-forest-800 transition hover:bg-forest-50 active:scale-90 disabled:cursor-not-allowed disabled:opacity-40"
        )}
      >
        <Minus className={icon} aria-hidden />
      </button>
      <span
        className={cn(
          "min-w-8 text-center text-sm font-bold tabular-nums text-charcoal",
          size === "sm" && "min-w-6 text-xs"
        )}
        aria-live="polite"
        aria-label={`${ariaLabel}: ${value}`}
      >
        {value}
      </span>
      <button
        type="button"
        onClick={() => onChange(Math.min(max, value + 1))}
        aria-label="Increase quantity"
        disabled={value >= max}
        className={cn(
          btn,
          "flex items-center justify-center text-forest-800 transition hover:bg-forest-50 active:scale-90 disabled:cursor-not-allowed disabled:opacity-40"
        )}
      >
        <Plus className={icon} aria-hidden />
      </button>
    </div>
  );
}
