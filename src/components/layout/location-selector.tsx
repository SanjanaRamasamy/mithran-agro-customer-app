"use client";

import { useState } from "react";
import { MapPin, Store } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { readStorage, writeStorage } from "@/utils/storage";
import { useHydrated } from "@/hooks/useHydrated";
import { cn } from "@/lib/utils";

const LOCATIONS = [
  { id: "hsr", label: "HSR Layout, Bengaluru", pincode: "560102", sameDay: true },
  { id: "indiranagar", label: "Indiranagar, Bengaluru", pincode: "560038", sameDay: true },
  { id: "koramangala", label: "Koramangala, Bengaluru", pincode: "560034", sameDay: true },
  { id: "whitefield", label: "Whitefield, Bengaluru", pincode: "560066", sameDay: true },
  { id: "jayangar", label: "Jayanagar, Bengaluru", pincode: "560041", sameDay: false },
];

/** Glass popover for delivery location (simulated). */
export function LocationSelector({ className }: { className?: string }) {
  const hydrated = useHydrated();
  const [locationId, setLocationId] = useState<string>("hsr");
  const [open, setOpen] = useState(false);

  const current =
    LOCATIONS.find((l) => l.id === (hydrated ? readStorage<string>("verdant.location", "hsr") : "hsr")) ??
    LOCATIONS[0];

  const select = (id: string) => {
    setLocationId(id);
    writeStorage("verdant.location", id);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        className={cn(
          "group flex items-center gap-2 rounded-xl px-2.5 py-2 text-left transition hover:bg-forest-50",
          className
        )}
        aria-label="Choose delivery location"
      >
        <MapPin className="size-4 shrink-0 text-forest-700" aria-hidden />
        <span className="min-w-0">
          <span className="block text-[10px] font-medium uppercase tracking-wide text-graymute">
            Deliver to
          </span>
          <span className="block max-w-[140px] truncate text-xs font-bold text-charcoal sm:max-w-[180px]">
            {current.label}
          </span>
        </span>
      </PopoverTrigger>
      <PopoverContent align="start" sideOffset={8} className="glass-strong w-72 rounded-2xl p-2">
        <p className="px-3 pb-2 pt-1.5 text-xs font-bold uppercase tracking-widest text-graymute">
          Choose delivery area
        </p>
        <ul className="space-y-0.5" role="listbox" aria-label="Locations">
          {LOCATIONS.map((loc) => (
            <li key={loc.id}>
              <button
                role="option"
                aria-selected={loc.id === locationId}
                onClick={() => select(loc.id)}
                className={cn(
                  "flex w-full items-center justify-between gap-2 rounded-xl px-3 py-2.5 text-left transition",
                  loc.id === locationId ? "bg-forest-50 text-forest-900" : "hover:bg-soft"
                )}
              >
                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold text-charcoal">{loc.label}</span>
                  <span className="block text-xs text-graymute">PIN {loc.pincode}</span>
                </span>
                {loc.sameDay && (
                  <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-lime-soft px-2 py-0.5 text-[10px] font-bold text-lime-deep">
                    <Store className="size-3" aria-hidden /> Same-day
                  </span>
                )}
              </button>
            </li>
          ))}
        </ul>
        <p className="px-3 pb-1 pt-2 text-[11px] leading-relaxed text-graymute">
          Simulated location service — serviceability data will come from the delivery API.
        </p>
      </PopoverContent>
    </Popover>
  );
}
