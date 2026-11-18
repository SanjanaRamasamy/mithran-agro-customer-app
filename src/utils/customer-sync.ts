import type { CartItem, WishlistEntry } from "@/types";

type JsonRecord = Record<string, unknown>;

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function parseCustomerCart(value: unknown): CartItem[] | null {
  if (!Array.isArray(value) || value.length > 50) return null;
  const items: CartItem[] = [];
  for (const entry of value) {
    if (!isRecord(entry)) return null;
    const productId = entry.productId;
    const variantId = entry.variantId;
    const quantity = entry.quantity;
    const addedAt = entry.addedAt;
    if (
      typeof productId !== "string" ||
      !/^\d+$/.test(productId) ||
      typeof variantId !== "string" ||
      !/^prestashop-\d+(?:-\d+)?$/.test(variantId) ||
      !Number.isSafeInteger(quantity) ||
      (quantity as number) < 1 ||
      typeof addedAt !== "string"
    ) return null;
    const id = typeof entry.id === "string" ? entry.id : `${productId}:${variantId}`;
    items.push({ id, productId, variantId, quantity: quantity as number, addedAt });
  }
  return items;
}

export function parseCustomerWishlist(value: unknown): WishlistEntry[] | null {
  if (!Array.isArray(value) || value.length > 500) return null;
  const entries: WishlistEntry[] = [];
  const seen = new Set<string>();
  for (const entry of value) {
    if (!isRecord(entry) || typeof entry.productId !== "string" || !/^\d+$/.test(entry.productId)) {
      return null;
    }
    if (seen.has(entry.productId)) continue;
    seen.add(entry.productId);
    entries.push({
      productId: entry.productId,
      addedAt: typeof entry.addedAt === "string" ? entry.addedAt : "",
    });
  }
  return entries;
}

export function mergeCustomerCart(remote: CartItem[], guest: CartItem[]): CartItem[] {
  const merged = new Map<string, CartItem>();
  for (const item of [...remote, ...guest]) {
    const existing = merged.get(item.id);
    merged.set(
      item.id,
      existing
        ? { ...existing, quantity: existing.quantity + item.quantity }
        : { ...item },
    );
  }
  return [...merged.values()];
}

export function mergeCustomerWishlist(
  remote: WishlistEntry[],
  guest: WishlistEntry[],
): WishlistEntry[] {
  const merged = new Map(remote.map((entry) => [entry.productId, entry]));
  for (const entry of guest) {
    if (!merged.has(entry.productId)) merged.set(entry.productId, entry);
  }
  return [...merged.values()];
}
