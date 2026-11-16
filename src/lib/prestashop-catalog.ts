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

function identifier(value: unknown, allowZero = false): string | null {
  const parsed = numberValue(value);
  if (
    parsed === undefined ||
    !Number.isSafeInteger(parsed) ||
    parsed < (allowZero ? 0 : 1)
  ) {
    return null;
  }
  return String(parsed);
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

function stockAvailableLinkIds(value: unknown): string[] | null {
  let collection = value;
  if (isRecord(collection) && isRecord(collection.prestashop)) {
    collection = collection.prestashop;
  }
  if (isRecord(collection) && "stock_availables" in collection) {
    collection = collection.stock_availables;
  }

  let links: unknown;
  if (Array.isArray(collection)) {
    links = collection;
  } else if (isRecord(collection)) {
    links = "stock_available" in collection
      ? collection.stock_available
      : collection;
  } else {
    return null;
  }
  const records = Array.isArray(links) ? links : [links];
  if (records.length === 0 || !records.every(isRecord)) return null;

  const ids = records.map((record) => identifier(record.id));
  if (ids.some((id) => id === null)) return null;
  return ids.filter((id): id is string => id !== null);
}

function imageIds(record: JsonRecord, associations: JsonRecord): string[] {
  const ids = [text(record.id_default_image), ...associatedIds(associations.images)]
    .filter(Boolean);
  return [...new Set(ids)];
}

export function getPrestaShopStockAvailableIds(products: unknown[]): string[] {
  return [...new Set(products.flatMap((value) => {
    if (!isRecord(value) || !isRecord(value.associations)) {
      throw new Error("Product is missing stock availability associations.");
    }

    const stockIds = stockAvailableLinkIds(value.associations.stock_availables);
    if (!stockIds || stockIds.length === 0) {
      throw new Error("Product has no linked stock availability records.");
    }
    return stockIds;
  }))];
}

export interface PrestaShopStockAvailable {
  id: string;
  productId: string | null;
  shopId: string | null;
  shopGroupId: string | null;
  shopGroupValid: boolean;
  quantity: number | undefined;
}

export function isPrestaShopQuantityAvailable(
  quantity: number | undefined,
  minimum: number | undefined,
  stock: number | undefined
): boolean {
  return (
    quantity !== undefined &&
    minimum !== undefined &&
    stock !== undefined &&
    Number.isSafeInteger(quantity) &&
    Number.isSafeInteger(minimum) &&
    Number.isSafeInteger(stock) &&
    quantity >= 1 &&
    minimum >= 1 &&
    stock >= 0 &&
    quantity >= minimum &&
    quantity <= stock
  );
}

export function parsePrestaShopStockAvailables(
  value: unknown
): PrestaShopStockAvailable[] {
  return rows(value, "stock_availables").flatMap((record) => {
    const id = identifier(record.id);
    if (!id) return [];
    const shopGroupId = record.id_shop_group === undefined
      ? null
      : identifier(record.id_shop_group, true);
    return [{
      id,
      productId: identifier(record.id_product),
      shopId: identifier(record.id_shop, true),
      shopGroupId,
      shopGroupValid: record.id_shop_group === undefined || shopGroupId !== null,
      quantity: numberValue(record.quantity),
    }];
  });
}

export function applyPrestaShopStockAvailables(
  products: unknown[],
  stockAvailables: PrestaShopStockAvailable[]
): unknown[] {
  const stockById = new Map<string, PrestaShopStockAvailable>();
  for (const stock of stockAvailables) {
    const previous = stockById.get(stock.id);
    if (
      previous &&
      (
        previous.productId !== stock.productId ||
        previous.shopId !== stock.shopId ||
        previous.shopGroupId !== stock.shopGroupId ||
        previous.shopGroupValid !== stock.shopGroupValid ||
        previous.quantity !== stock.quantity
      )
    ) {
      throw new Error("PrestaShop returned conflicting data for a stock record.");
    }
    stockById.set(stock.id, stock);
  }

  return products.map((product) => {
    if (!isRecord(product) || !isRecord(product.associations)) {
      throw new Error("Product is missing stock availability associations.");
    }

    const productId = identifier(product.id);
    const shopId = identifier(product.id_shop_default);
    if (!productId || !shopId) {
      throw new Error("Product is missing its product or default shop identifier.");
    }

    const linkedIds = stockAvailableLinkIds(product.associations.stock_availables);
    if (!linkedIds || linkedIds.length === 0) {
      throw new Error("Product has no linked stock availability records.");
    }
    const stockIds = [...new Set(linkedIds)];
    if (stockIds.length === 0) {
      throw new Error("Product has no linked stock availability records.");
    }
    if (stockIds.some((id) => !stockById.has(id))) {
      throw new Error("PrestaShop returned incomplete stock availability data.");
    }

    const linkedStocks = stockIds.map((id) => stockById.get(id)!);
    for (const stock of linkedStocks) {
      if (
        stock.productId !== productId ||
        stock.shopId !== shopId ||
        !stock.shopGroupValid ||
        (stock.shopGroupId !== null && stock.shopGroupId !== "0")
      ) {
        throw new Error("PrestaShop stock record does not match the product shop context.");
      }
      if (
        stock.quantity === undefined ||
        !Number.isSafeInteger(stock.quantity) ||
        stock.quantity < 0
      ) {
        throw new Error("PrestaShop stock record has an invalid quantity.");
      }
    }

    // This catalog exposes one sellable variant per product, so distinct attribute
    // stock rows are aggregated only after validating their shared product/shop scope.
    const quantity = linkedStocks.reduce((total, stock) => {
      if (stock.quantity === undefined) {
        throw new Error("PrestaShop stock record has an invalid quantity.");
      }
      return total + stock.quantity;
    }, 0);
    if (!Number.isSafeInteger(quantity)) {
      throw new Error("PrestaShop stock total exceeds the supported quantity range.");
    }
    return { ...product, quantity };
  });
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
      stockAvailableIds: stockAvailableLinkIds(associations.stock_availables) ?? [],
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