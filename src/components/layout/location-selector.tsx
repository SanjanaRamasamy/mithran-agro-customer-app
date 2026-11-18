"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Check, MapPin, Plus, Store } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useAuth } from "@/contexts/AuthContext";
import { readStorage, writeStorage } from "@/utils/storage";
import { useHydrated } from "@/hooks/useHydrated";
import { cn } from "@/lib/utils";

const GUEST_LOCATIONS = [
  { id: "hsr", label: "HSR Layout, Bengaluru", pincode: "560102", sameDay: true },
  { id: "indiranagar", label: "Indiranagar, Bengaluru", pincode: "560038", sameDay: true },
  { id: "koramangala", label: "Koramangala, Bengaluru", pincode: "560034", sameDay: true },
  { id: "whitefield", label: "Whitefield, Bengaluru", pincode: "560066", sameDay: true },
  { id: "jayanagar", label: "Jayanagar, Bengaluru", pincode: "560041", sameDay: false },
];

/**
 * Header delivery-location selector:
 * - Signed-in customers see ONLY their actual saved customer addresses.
 * - Guests see the delivery area selector without exposing any customer addresses.
 */
export function LocationSelector({ className }: { className?: string }) {
  const hydrated = useHydrated();
  const { user, isAuthenticated, addresses } = useAuth();
  const [selectedAddressId, setSelectedAddressId] = useState<string>("");
  const [guestLocationId, setGuestLocationId] = useState<string>("hsr");
  const [open, setOpen] = useState(false);

  const addressStorageKey = user ? `mithran.selectedAddress.${user.id}` : "";

  useEffect(() => {
    if (!hydrated || !isAuthenticated || !user) return;
    const savedId = readStorage<string>(addressStorageKey, "");
    const match = addresses.find((a) => a.id === savedId);
    if (match) {
      setSelectedAddressId(match.id);
    } else {
      const fallback = addresses.find((a) => a.isDefault) ?? addresses[0];
      setSelectedAddressId(fallback?.id ?? "");
    }
  }, [hydrated, isAuthenticated, user, addresses, addressStorageKey]);

  const activeAddress =
    isAuthenticated && addresses.length > 0
      ? addresses.find((a) => a.id === selectedAddressId) ??
        addresses.find((a) => a.isDefault) ??
        addresses[0]
      : null;

  const activeGuestLocation =
    GUEST_LOCATIONS.find(
      (l) => l.id === (hydrated ? readStorage<string>("verdant.location", guestLocationId) : "hsr"),
    ) ?? GUEST_LOCATIONS[0];

  const triggerLabel = isAuthenticated
    ? activeAddress
      ? `${activeAddress.label} · ${activeAddress.city} (${activeAddress.pincode})`
      : "Add delivery address"
    : activeGuestLocation.label;

  const selectSavedAddress = (addressId: string) => {
    setSelectedAddressId(addressId);
    if (addressStorageKey) writeStorage(addressStorageKey, addressId);
    setOpen(false);
  };

  const selectGuestLocation = (id: string) => {
    setGuestLocationId(id);
    writeStorage("verdant.location", id);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        className={cn(
          "group flex items-center gap-2 rounded-xl px-2.5 py-2 text-left transition hover:bg-forest-50",
          className,
        )}
        aria-label="Choose delivery location"
      >
        <MapPin className="size-4 shrink-0 text-forest-700" aria-hidden />
        <span className="min-w-0">
          <span className="block text-[10px] font-medium uppercase tracking-wide text-graymute">
            Deliver to
          </span>
          <span className="block max-w-[140px] truncate text-xs font-bold text-charcoal sm:max-w-[190px]">
            {triggerLabel}
          </span>
        </span>
      </PopoverTrigger>

      <PopoverContent align="start" sideOffset={8} className="glass-strong w-80 rounded-2xl p-2">
        {isAuthenticated ? (
          <div>
            <div className="flex items-center justify-between px-3 pb-2 pt-1.5">
              <p className="text-xs font-bold uppercase tracking-widest text-graymute">
                Saved addresses ({addresses.length})
              </p>
              <Link
                href="/account?tab=addresses"
                onClick={() => setOpen(false)}
                className="text-xs font-semibold text-forest-700 hover:text-forest-900"
              >
                Manage
              </Link>
            </div>

            {addresses.length === 0 ? (
              <div className="px-3 py-4 text-center">
                <p className="text-xs text-graymute">You have no saved delivery addresses yet.</p>
                <Link
                  href="/account?tab=addresses"
                  onClick={() => setOpen(false)}
                  className="mt-3 inline-flex h-9 items-center gap-1.5 rounded-xl bg-forest-900 px-4 text-xs font-bold text-white transition hover:bg-forest-800"
                >
                  <Plus className="size-3.5" aria-hidden />
                  Add delivery address
                </Link>
              </div>
            ) : (
              <>
                <ul className="max-h-64 space-y-1 overflow-y-auto" role="listbox" aria-label="Saved delivery addresses">
                  {addresses.map((addr) => {
                    const isSelected = activeAddress?.id === addr.id;
                    return (
                      <li key={addr.id}>
                        <button
                          type="button"
                          role="option"
                          aria-selected={isSelected}
                          onClick={() => selectSavedAddress(addr.id)}
                          className={cn(
                            "flex w-full items-start justify-between gap-2 rounded-xl px-3 py-2.5 text-left transition",
                            isSelected ? "bg-forest-50 text-forest-900" : "hover:bg-soft",
                          )}
                        >
                          <span className="min-w-0 flex-1">
                            <span className="flex items-center gap-1.5 text-sm font-semibold text-charcoal">
                              {addr.label}
                              {addr.isDefault && (
                                <span className="rounded-full bg-lime-soft px-2 py-0.5 text-[10px] font-bold text-lime-deep">
                                  Default
                                </span>
                              )}
                            </span>
                            <span className="mt-0.5 block truncate text-xs text-graymute">
                              {addr.line1}, {addr.city} — {addr.pincode}
                            </span>
                          </span>
                          {isSelected && <Check className="mt-1 size-4 shrink-0 text-forest-700" aria-hidden />}
                        </button>
                      </li>
                    );
                  })}
                </ul>
                <div className="mt-1.5 border-t border-forest-50 pt-1.5">
                  <Link
                    href="/account?tab=addresses"
                    onClick={() => setOpen(false)}
                    className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold text-forest-800 transition hover:bg-forest-50"
                  >
                    <Plus className="size-3.5" aria-hidden />
                    Add new address
                  </Link>
                </div>
              </>
            )}
          </div>
        ) : (
          <div>
            <p className="px-3 pb-2 pt-1.5 text-xs font-bold uppercase tracking-widest text-graymute">
              Choose delivery area
            </p>
            <ul className="space-y-0.5" role="listbox" aria-label="Delivery areas">
              {GUEST_LOCATIONS.map((loc) => (
                <li key={loc.id}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={loc.id === activeGuestLocation.id}
                    onClick={() => selectGuestLocation(loc.id)}
                    className={cn(
                      "flex w-full items-center justify-between gap-2 rounded-xl px-3 py-2.5 text-left transition",
                      loc.id === activeGuestLocation.id ? "bg-forest-50 text-forest-900" : "hover:bg-soft",
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
            <p className="mt-1.5 border-t border-forest-50 px-3 pb-1 pt-2 text-[11px] leading-relaxed text-graymute">
              <Link href="/login" onClick={() => setOpen(false)} className="font-bold text-forest-800 hover:underline">
                Sign in
              </Link>{" "}
              to select from your saved delivery addresses.
            </p>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
