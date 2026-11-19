import type { OrderStatus, ProductBadge } from "@/types";

/* ------------------------- Commerce rules ----------------------- */

export const FREE_DELIVERY_THRESHOLD = 499; // INR
export const DELIVERY_FEE = 39;
export const EXPRESS_FEE = 59;
export const HANDLING_FEE = 9;
export const GREEN_FEE = 5; // compostable packaging contribution
export const TAX_RATE = 0.05; // 5% GST on produce value (mock)

export const PRICE_BOUNDS: [number, number] = [0, 30000];

/* --------------------------- Badges ----------------------------- */

export const BADGE_CONFIG: Record<
  ProductBadge,
  { label: string; className: string }
> = {
  organic: {
    label: "Certified Organic",
    className: "bg-forest-100 text-forest-800 border-forest-200",
  },
  seasonal: {
    label: "In Season",
    className: "bg-amber-50 text-amber-700 border-amber-200",
  },
  bestseller: {
    label: "Best Seller",
    className: "bg-forest-900 text-white border-forest-900",
  },
  new: {
    label: "New Harvest",
    className: "bg-lime-soft text-lime-deep border-lime-200",
  },
  local: {
    label: "Local Farm",
    className: "bg-emerald-soft text-emerald-800 border-emerald-200",
  },
  deal: {
    label: "Deal",
    className: "bg-red-50 text-red-700 border-red-200",
  },
  limited: {
    label: "Limited Stock",
    className: "bg-orange-50 text-orange-700 border-orange-200",
  },
};

/* ------------------------- Order status ------------------------- */

export const ORDER_STATUS_CONFIG: Record<
  OrderStatus,
  { label: string; className: string; dotClassName: string }
> = {
  placed: {
    label: "Order Placed",
    className: "bg-blue-50 text-blue-700 border-blue-200",
    dotClassName: "bg-blue-500",
  },
  confirmed: {
    label: "Confirmed",
    className: "bg-forest-50 text-forest-700 border-forest-200",
    dotClassName: "bg-forest-500",
  },
  packed: {
    label: "Processing",
    className: "bg-amber-50 text-amber-700 border-amber-200",
    dotClassName: "bg-amber-500",
  },
  "out-for-delivery": {
    label: "Out for Delivery",
    className: "bg-lime-soft text-lime-deep border-lime-200",
    dotClassName: "bg-lime-500",
  },
  delivered: {
    label: "Delivered",
    className: "bg-emerald-soft text-emerald-800 border-emerald-200",
    dotClassName: "bg-emerald-500",
  },
  cancelled: {
    label: "Cancelled",
    className: "bg-red-50 text-red-700 border-red-200",
    dotClassName: "bg-red-500",
  },
  "return-requested": {
    label: "Return Requested",
    className: "bg-orange-50 text-orange-700 border-orange-200",
    dotClassName: "bg-orange-500",
  },
  returned: {
    label: "Returned",
    className: "bg-gray-100 text-gray-600 border-gray-200",
    dotClassName: "bg-gray-400",
  },
};

export const TRACKING_FLOW: OrderStatus[] = [
  "placed",
  "confirmed",
  "packed",
  "out-for-delivery",
  "delivered",
];

/* --------------------------- Payment ---------------------------- */

export const PAYMENT_METHODS = [
  { id: "cod", label: "Cash on Delivery", hint: "Pay when the order arrives; collection is recorded on delivery." },
] as const;

/* -------------------------- Sort options ------------------------ */

export const SORT_OPTIONS: { value: string; label: string }[] = [
  { value: "relevance", label: "Relevance" },
  { value: "price-asc", label: "Price: Low to High" },
  { value: "price-desc", label: "Price: High to Low" },
  { value: "rating-desc", label: "Top Rated" },
  { value: "discount-desc", label: "Biggest Discount" },
  { value: "newest", label: "Newest Harvest" },
];

/* ------------------------ Misc constants ------------------------ */

export const PAGE_SIZE = 12;
export const INFINITE_STEP = 8;

export const ANNOUNCEMENTS = [
  "Free delivery on orders above ₹499",
  "Use code FRESH20 for 20% off your first order",
  "Harvested this morning — delivered within 24 hours",
  "Organic fertilizers now shipping across South India",
  "New: handwoven sarees & kurtis from artisan clusters",
];

export const TRUST_POINTS = [
  {
    title: "100% Certified Organic",
    description:
      "Every farm and input is India Organic certified, with soil reports audited every season.",
  },
  {
    title: "Farm-to-Door in 24h",
    description:
      "Produce is picked at dawn and reaches your kitchen within a day — never cold-stored for weeks.",
  },
  {
    title: "Weaver-First Fashion",
    description:
      "Sarees and kurtis bought directly from handloom clusters at honest, transparent prices.",
  },
  {
    title: "Honest, Secure Pricing",
    description:
      "No middlemen, no hidden charges — farm-direct prices with fully secure, simulated checkouts.",
  },
] as const;

export const STORAGE_GUIDE = {
  fashion: "First wash separately in cold water. Dry in shade to protect natural dyes.",
  "agri-input":
    "Store in a cool, dry place away from sunlight. Reseal after every use.",
  default:
    "Refrigerate produce in the crisper drawer; wash just before use, not before storage.",
} as const;
