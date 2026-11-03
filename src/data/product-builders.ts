import type { Product, ProductBadge, ProductVariant } from "@/types";
import { gallery } from "./images";

/* ================================================================
   Shared mock-product builders.
   products.ts (base catalogue) and data/extensions/* all use these
   so every SKU carries the same shape and stays type-safe.
   ================================================================ */

export const NOW = Date.now();
export const hoursAgo = (h: number) => new Date(NOW - h * 3600_000).toISOString();
export const daysAgo = (d: number) => new Date(NOW - d * 86_400_000).toISOString();
export const daysAhead = (d: number) => new Date(NOW + d * 86_400_000).toISOString();

export const v = (
  id: string,
  name: string,
  unit: ProductVariant["packSize"]["unit"],
  value: number,
  price: number,
  mrp: number,
  inStock = true,
  stockCount = 50
): ProductVariant => ({
  id,
  name,
  packSize: { value, unit },
  price,
  mrp,
  inStock,
  stockCount: inStock ? stockCount : 0,
});

type Raw = Omit<Product, "slug" | "createdAt" | "storageLifeDays" | "images"> & {
  imgKey: string;
  slug: string;
  createdHoursAgo: number;
  storageLifeDays: number;
};

export function build(raw: Raw): Product {
  const { imgKey, createdHoursAgo, storageLifeDays, ...rest } = raw;
  return {
    ...rest,
    images: gallery(imgKey),
    createdAt: hoursAgo(createdHoursAgo),
    storageLifeDays,
  };
}

/* ------------------- compact builder for extensions -------------- */

export interface SimpleSeed {
  id: string;
  name: string;
  tagline: string;
  description: string;
  categoryId: string;
  sellerId: string;
  /** Key in data/images.ts — SmartImage falls back to a gradient if empty. */
  imgKey?: string;
  variants: ProductVariant[];
  rating?: number;
  reviewCount?: number;
  badges?: ProductBadge[];
  tags: string[];
  isOrganic?: boolean;
  isSeasonal?: boolean;
  isBestSeller?: boolean;
  isNew?: boolean;
  harvestDaysAgo?: number;
  origin?: string;
  storage?: string;
  storageLifeDays?: number;
  organicDetails?: string;
  deliveryEligible?: boolean;
  unitsSold?: number;
  createdHoursAgo?: number;
  /* category-specific attributes */
  brand?: string;
  freshnessNote?: string;
  sizes?: string[];
  colors?: string[];
  fabric?: string;
  fit?: string;
  composition?: string;
  application?: string;
  suitableCrops?: string;
  potSize?: string;
  plantHeight?: string;
  careInstructions?: string;
  germinationRate?: string;
  sowingSeason?: string;
}

const DEFAULT_STORAGE =
  "Store in a cool, dry place away from direct sunlight. Reseal after every use.";

export function simple(seed: SimpleSeed): Product {
  const imgKey = seed.imgKey ?? "";
  return build({
    id: seed.id,
    slug: seed.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, ""),
    name: seed.name,
    tagline: seed.tagline,
    description: seed.description,
    categoryId: seed.categoryId,
    sellerId: seed.sellerId,
    imgKey,
    variants: seed.variants,
    rating: seed.rating ?? 4.5,
    reviewCount: seed.reviewCount ?? 120,
    badges: seed.badges ?? (seed.isOrganic ? ["organic"] : []),
    tags: seed.tags,
    isOrganic: seed.isOrganic ?? true,
    isSeasonal: seed.isSeasonal ?? false,
    isBestSeller: seed.isBestSeller ?? false,
    isNew: seed.isNew ?? false,
    harvestDate: daysAgo(seed.harvestDaysAgo ?? 4),
    origin: seed.origin ?? "Karnataka, India",
    storage: seed.storage ?? DEFAULT_STORAGE,
    storageLifeDays: seed.storageLifeDays ?? 365,
    organicDetails: seed.organicDetails,
    deliveryEligible: seed.deliveryEligible ?? true,
    unitsSold: seed.unitsSold ?? 800,
    createdHoursAgo: seed.createdHoursAgo ?? 72,
    brand: seed.brand,
    freshnessNote: seed.freshnessNote,
    sizes: seed.sizes,
    colors: seed.colors,
    fabric: seed.fabric,
    fit: seed.fit,
    composition: seed.composition,
    application: seed.application,
    suitableCrops: seed.suitableCrops,
    potSize: seed.potSize,
    plantHeight: seed.plantHeight,
    careInstructions: seed.careInstructions,
    germinationRate: seed.germinationRate,
    sowingSeason: seed.sowingSeason,
  });
}

/** Convenience: weight-based variants in grams from [ [label, g, price, mrp] ]. */
export const gv = (
  rows: [label: string, grams: number, price: number, mrp: number, inStock?: boolean][]
): ProductVariant[] =>
  rows.map(([label, g, price, mrp, inStock], i) =>
    v(`v${i + 1}`, label, "g", g, price, mrp, inStock ?? true)
  );

/** Convenience: size-based fashion variants — one variant per size. */
export const sv = (
  sizes: { label: string; price: number; mrp: number; inStock?: boolean }[]
): ProductVariant[] =>
  sizes.map((s, i) =>
    v(`v${i + 1}`, s.label, "pc", 1, s.price, s.mrp, s.inStock ?? true, 40)
  );
