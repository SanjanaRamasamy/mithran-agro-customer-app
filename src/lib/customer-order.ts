import type { Address, CartTotals, Order, OrderItem, OrderStatus, TrackingEvent } from "@/types";

type JsonRecord = Record<string, unknown>;

const ORDER_STATUSES: OrderStatus[] = [
  "placed",
  "confirmed",
  "packed",
  "out-for-delivery",
  "delivered",
  "cancelled",
  "return-requested",
  "returned",
];

/**
 * Canonical order-status normalizer shared across order cards, history tabs,
 * detail badges, and tracking timelines. Never infers "delivered" from
 * "Awaiting Cash on Delivery" or payment-pending states.
 */
export function normalizeTrackingStatus(title: string, fallback: OrderStatus): OrderStatus {
  const name = title.trim().toLowerCase();
  if (!name) return fallback;
  if (name.includes("cancel") || name.includes("refund")) {
    return "cancelled";
  }
  if (name.includes("return") && name.includes("request")) {
    return "return-requested";
  }
  if (/\breturned\b/.test(name)) {
    return "returned";
  }
  if (
    (name.includes("await") || name.includes("pending") || name.includes("cash on delivery")) &&
    !/\bdelivered\b/.test(name)
  ) {
    return "placed";
  }
  if (/\bdelivered\b/.test(name)) {
    return "delivered";
  }
  if (name.includes("ship") || name.includes("out for delivery")) {
    return "out-for-delivery";
  }
  if (name.includes("pack") || name.includes("prepar") || name.includes("process")) {
    return "packed";
  }
  if (name.includes("confirm") || name.includes("payment accepted")) {
    return "confirmed";
  }
  return fallback;
}

export function normalizeOrderStatus(
  rawStatus: OrderStatus,
  tracking: TrackingEvent[],
  paymentStatus: "paid" | "pending" = "pending",
): OrderStatus {
  if (tracking.length > 0) {
    return tracking[tracking.length - 1].status;
  }
  if (rawStatus === "delivered" && paymentStatus === "pending") {
    return "placed";
  }
  return rawStatus;
}

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function string(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

function finiteNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function parseAddress(value: unknown): Address | null {
  if (!isRecord(value)) return null;
  const id = string(value.id);
  const name = string(value.name);
  const line1 = string(value.line1);
  const city = string(value.city);
  const state = string(value.state);
  const pincode = string(value.pincode);
  if (!id || !name || !line1 || !city || !state || !pincode) return null;
  const type = value.type === "work" || value.type === "other" ? value.type : "home";
  return {
    id,
    label: string(value.label) ?? "Address",
    name,
    phone: string(value.phone) ?? "",
    line1,
    line2: string(value.line2) ?? undefined,
    city,
    state,
    pincode,
    type,
    isDefault: value.isDefault === true,
    deliveryInstructions: string(value.deliveryInstructions) ?? undefined,
  };
}

function parseItem(value: unknown): OrderItem | null {
  if (!isRecord(value)) return null;
  const id = string(value.id);
  const productId = string(value.productId);
  const variantId = string(value.variantId);
  const name = string(value.name);
  const quantity = finiteNumber(value.quantity);
  const price = finiteNumber(value.price);
  const mrp = finiteNumber(value.mrp);
  const lineTotal = finiteNumber(value.lineTotal);
  if (!id || !productId || !variantId || !name || quantity === null || price === null || mrp === null || lineTotal === null) {
    return null;
  }
  const rawSellerName = string(value.sellerName) ?? "";
  const sellerName = /^(mithran\s*agro|mithren\s*agro)$/i.test(rawSellerName.trim())
    ? "Agro"
    : rawSellerName;
  return {
    id,
    productId,
    variantId,
    name,
    image: string(value.image) ?? "",
    sellerName,
    packLabel: string(value.packLabel) ?? "Unit",
    quantity,
    price,
    mrp,
    lineTotal,
  };
}

function parseTrackingEvent(value: unknown): TrackingEvent | null {
  if (!isRecord(value) || !ORDER_STATUSES.includes(value.status as OrderStatus)) return null;
  const id = string(value.id);
  const title = string(value.title);
  const rawDescription = string(value.description);
  const timestamp = string(value.timestamp);
  if (!id || !title || rawDescription === null || timestamp === null || typeof value.completed !== "boolean") return null;
  const description = /prestashop/i.test(rawDescription)
    ? "Order status updated."
    : rawDescription;
  return {
    id,
    status: normalizeTrackingStatus(title, value.status as OrderStatus),
    title,
    description,
    timestamp,
    completed: value.completed,
  };
}

function parseTotals(value: unknown): CartTotals | null {
  if (!isRecord(value)) return null;
  const keys: (keyof CartTotals)[] = [
    "subtotal",
    "mrpTotal",
    "savings",
    "deliveryFee",
    "handlingFee",
    "greenFee",
    "discount",
    "tax",
    "total",
  ];
  const totals = {} as CartTotals;
  for (const key of keys) {
    const amount = finiteNumber(value[key]);
    if (amount === null) return null;
    totals[key] = amount;
  }
  return totals;
}

export function parseCustomerOrder(value: unknown): Order | null {
  if (!isRecord(value)) return null;
  const id = string(value.id);
  const userId = string(value.userId);
  const status = value.status;
  const placedAt = string(value.placedAt);
  const scheduledSlot = string(value.scheduledSlot);
  const paymentMethod = string(value.paymentMethod);
  const paymentId = string(value.paymentId);
  const address = parseAddress(value.address);
  const totals = parseTotals(value.totals);
  if (
    !id ||
    !userId ||
    !ORDER_STATUSES.includes(status as OrderStatus) ||
    !placedAt ||
    !scheduledSlot ||
    !paymentMethod ||
    !paymentId ||
    !address ||
    !totals ||
    !Array.isArray(value.items) ||
    !Array.isArray(value.tracking) ||
    typeof value.canCancel !== "boolean" ||
    typeof value.canReturn !== "boolean"
  ) return null;

  const items = value.items.map(parseItem);
  const tracking = value.tracking.map(parseTrackingEvent);
  if (items.some((item) => item === null) || tracking.some((event) => event === null)) return null;

  const normalizedTracking = tracking as TrackingEvent[];
  const paymentStatus: "paid" | "pending" = value.paymentStatus === "paid" ? "paid" : "pending";
  const canonicalStatus = normalizeOrderStatus(status as OrderStatus, normalizedTracking, paymentStatus);

  return {
    id,
    reference: string(value.reference) ?? undefined,
    userId,
    items: items as OrderItem[],
    status: canonicalStatus,
    placedAt,
    deliveredAt: canonicalStatus === "delivered" ? (string(value.deliveredAt) ?? undefined) : undefined,
    scheduledSlot,
    address,
    paymentMethod,
    paymentId,
    paymentStatus,
    totals,
    couponCode: string(value.couponCode) ?? undefined,
    invoiceNo: string(value.invoiceNo) ?? "Not issued",
    tracking: normalizedTracking,
    canCancel: value.canCancel,
    canReturn: value.canReturn,
    deliveryPartner: string(value.deliveryPartner) ?? undefined,
  };
}

export function parseCustomerOrders(value: unknown): Order[] | null {
  if (!Array.isArray(value)) return null;
  const orders = value.map(parseCustomerOrder);
  return orders.some((order) => order === null) ? null : orders as Order[];
}
