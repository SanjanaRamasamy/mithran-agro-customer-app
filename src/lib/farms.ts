/**
 * Farm directory — data contract shared by the `/api/farms` route handlers
 * and the client catalogue.
 *
 * Farms are created by store administrators in the `mithranagroapp`
 * PrestaShop module (Modules → Mithran Agro Customer App → Configure →
 * "Farms & sellers"). The module is the single source of truth for which
 * product belongs to which farm; nothing here invents farm data.
 */

export interface Farm {
  id: string;
  slug: string;
  name: string;
  ownerName: string;
  location: string;
  shortDescription: string;
  story: string;
  logoUrl: string;
  coverUrl: string;
  /** True only when the store recorded a verification note in the module. */
  isVerified: boolean;
  verificationNote: string;
  /** Present only when the farm consented to publishing contact details. */
  contactEmail: string;
  contactPhone: string;
  /** Active, visible PrestaShop product IDs assigned to this farm. */
  productIds: string[];
  updatedAt: string;
}

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function text(value: unknown, max: number): string {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function httpsUrl(value: unknown): string {
  const raw = text(value, 500);
  if (!raw) return "";
  try {
    const url = new URL(raw);
    return url.protocol === "https:" && !url.username && !url.password ? url.toString() : "";
  } catch {
    return "";
  }
}

export function isFarmSlug(value: unknown): value is string {
  return typeof value === "string" && value.length <= 128 && SLUG_PATTERN.test(value);
}

/** Validate one farm from the module response. Invalid farms are dropped. */
export function parseFarm(value: unknown): Farm | null {
  if (!isRecord(value)) return null;
  const id = text(value.id, 16);
  const slug = text(value.slug, 128);
  const name = text(value.name, 128);
  if (!/^\d+$/.test(id) || !isFarmSlug(slug) || name.length < 2) return null;

  const productIds = Array.isArray(value.productIds)
    ? [...new Set(value.productIds.map((p) => String(p)).filter((p) => /^\d+$/.test(p)))]
    : [];
  const verificationNote = text(value.verificationNote, 255);

  return {
    id,
    slug,
    name,
    ownerName: text(value.ownerName, 128),
    location: text(value.location, 160),
    shortDescription: text(value.shortDescription, 400),
    story: text(value.story, 5000),
    logoUrl: httpsUrl(value.logoUrl),
    coverUrl: httpsUrl(value.coverUrl),
    // A "verified" badge without a recorded verification is never shown.
    isVerified: value.isVerified === true && verificationNote.length > 0,
    verificationNote,
    contactEmail: text(value.contactEmail, 255),
    contactPhone: text(value.contactPhone, 32),
    productIds,
    updatedAt: text(value.updatedAt, 32),
  };
}

export function parseFarms(value: unknown): Farm[] {
  if (!Array.isArray(value)) return [];
  const seenSlugs = new Set<string>();
  const claimedProducts = new Set<string>();
  const farms: Farm[] = [];
  for (const candidate of value) {
    const farm = parseFarm(candidate);
    if (!farm || seenSlugs.has(farm.slug)) continue;
    seenSlugs.add(farm.slug);
    // The module enforces one farm per product; defend against drift anyway.
    farm.productIds = farm.productIds.filter((id) => {
      if (claimedProducts.has(id)) return false;
      claimedProducts.add(id);
      return true;
    });
    farms.push(farm);
  }
  return farms;
}

/** productId → farm slug */
export function productFarmIndex(farms: Farm[]): Map<string, string> {
  const index = new Map<string, string>();
  for (const farm of farms) {
    for (const productId of farm.productIds) index.set(productId, farm.slug);
  }
  return index;
}
