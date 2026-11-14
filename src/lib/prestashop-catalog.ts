import type { PackUnit, Product, ProductVariant } from "@/types";

type JsonRecord = Record<string, unknown>;

export interface PrestaShopCategory {
  id: string;
  parentId: string;
  name: string;
  slug: string;
  description: string;
  active: boolean;
  level: number;
}

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function text(value: unknown): string {
  if (typeof value === "string") return value.trim();
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return "";
}

function numberValue(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
}

function flag(value: unknown): boolean {
  return value === true || value === 1 || value === "1";
}

function rows(value: unknown, key: string): JsonRecord[] {
  if (Array.isArray(value)) return value.filter(isRecord);
  if (!isRecord(value)) return [];

  const wrapped = isRecord(value.prestashop) ? value.prestashop : value;
  const collection = wrapped[key] ?? wrapped;
  if (Array.isArray(collection)) return collection.filter(isRecord);
  if (!isRecord(collection)) return [];

  const singular = collection[key.slice(0, -1)];
  if (Array.isArray(singular)) return singular.filter(isRecord);
  if (isRecord(singular)) return [singular];
  return Object.keys(collection).length > 0 && !("success" in collection)
    ? [collection]
    : [];
}

export function parsePrestaShopCategories(value: unknown): PrestaShopCategory[] {
  return rows(value, "categories").flatMap((record) => {
    const id = text(record.id);
    if (!id) return [];
    return [{
      id,
      parentId: text(record.id_parent),
      name: text(record.name),
      slug: text(record.link_rewrite),
      description: text(record.description),
      active: flag(record.active),
      level: numberValue(record.level_depth) ?? 0,
    }];
  });
}

function packUnit(unit: string): PackUnit {
  const normalized = unit.toLowerCase();
  if (/(^|\b)(kg|kilo|kilogram)/.test(normalized)) return "kg";
  if (/(^|\b)(g|gram)/.test(normalized)) return "g";
  if (/(^|\b)(ml|milliliter)/.test(normalized)) return "ml";
  if (/(^|\b)(l|liter|litre)/.test(normalized)) return "l";
  if (/bunch/.test(normalized)) return "bunch";
  if (/pack/.test(normalized)) return "pack";
  if (/box/.test(normalized)) return "box";
  if (/set/.test(normalized)) return "set";
  return "pc";
}

function associatedIds(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((entry) => {
    if (!isRecord(entry)) return [];
    const id = text(entry.id);
    return id ? [id] : [];
  });
}

function imageIds(record: JsonRecord, associations: JsonRecord): string[] {
  const ids = [text(record.id_default_image), ...associatedIds(associations.images)]
    .filter(Boolean);
  return [...new Set(ids)];
}

export function mapPrestaShopProduct(
  value: unknown,
  categories: PrestaShopCategory[]
): Product | null {
  if (!isRecord(value)) return null;

  const productId = text(value.id);
  const name = text(value.name);
  const price = numberValue(value.price);
  if (!productId || !name || price === undefined) return null;

  const associations = isRecord(value.associations) ? value.associations : {};
  const categoryIds = [...new Set([
    ...associatedIds(associations.categories),
    text(value.id_category_default),
  ].filter(Boolean))];
  const categoriesById = new Map(categories.map((category) => [category.id, category]));
  const primaryCategory = [...categoryIds]
    .map((id) => categoriesById.get(id))
    .filter((category): category is PrestaShopCategory => Boolean(category))
    .sort((left, right) => right.level - left.level)[0];

  const categorySlugs = new Set<string>();
  const categoryNames = new Set<string>();
  const categoryAncestorIds = new Set(categoryIds);
  for (const id of categoryIds) {
    let category = categoriesById.get(id);
    const visited = new Set<string>();
    while (category && !visited.has(category.id)) {
      visited.add(category.id);
      categoryAncestorIds.add(category.id);
      if (category.slug) categorySlugs.add(category.slug);
      if (category.name) categoryNames.add(category.name);
      category = categoriesById.get(category.parentId);
    }
  }

  const unit = text(value.unity);
  const quantity = Math.max(0, numberValue(value.quantity) ?? 0);
  const minimumQuantity = Math.max(1, numberValue(value.minimal_quantity) ?? 1);
  const active = flag(value.active);
  const availableForOrder = flag(value.available_for_order);
  const inStock = active && availableForOrder && quantity >= minimumQuantity;
  const variant: ProductVariant = {
    id: `prestashop-${productId}`,
    name: unit || "Unit",
    packSize: { value: 1, unit: packUnit(unit), label: unit || undefined },
    price,
    mrp: price,
    inStock,
    stockCount: quantity,
  };
  const productImageIds = imageIds(value, associations);
  const images = productImageIds.map(
    (imageId) => `/api/prestashop/images/products/${encodeURIComponent(productId)}/${encodeURIComponent(imageId)}`
  );
  const slug = text(value.link_rewrite) || `product-${productId}`;

  return {
    id: productId,
    slug,
    name,
    tagline: "",
    description: text(value.description) || text(value.description_short),
    categoryId: primaryCategory?.slug || primaryCategory?.id || "",
    sellerId: "",
    images,
    variants: [variant],
    rating: 0,
    reviewCount: 0,
    badges: [],
    tags: [],
    isOrganic: false,
    isSeasonal: false,
    isBestSeller: false,
    isNew: false,
    harvestDate: "",
    origin: "",
    storage: "",
    storageLifeDays: 0,
    deliveryEligible: false,
    createdAt: text(value.date_add),
    prestaShop: {
      productId,
      categoryIds,
      categoryAncestorIds: [...categoryAncestorIds],
      categorySlugs: [...categorySlugs],
      categoryNames: [...categoryNames],
      categoryName: primaryCategory?.name ?? "",
      imageIds: productImageIds,
      stockAvailableIds: associatedIds(associations.stock_availables),
      minimumQuantity,
      quantity,
      unitPrice: numberValue(value.unit_price),
      wholesalePrice: numberValue(value.wholesale_price),
      active,
      availableForOrder,
      visibility: text(value.visibility),
      unit,
    },
  };
}