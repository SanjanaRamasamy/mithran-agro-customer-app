/* ================================================================
   Mithren Agro Marketplace — Global TypeScript types
   All mock data and contexts conform to these interfaces.
   ================================================================ */

import type { LucideIcon } from "lucide-react";

/* ------------------------------- Core --------------------------- */

export type PackUnit = "g" | "kg" | "ml" | "l" | "pc" | "bunch" | "pack" | "box" | "set";

export interface PackSize {
  value: number;
  unit: PackUnit;
  label?: string; // e.g. "500 g pack", "1 pc (~200 g)"
}

export interface ProductVariant {
  id: string;
  name: string; // e.g. "500 g", "1 kg", "Baby (250 g)"
  packSize: PackSize;
  price: number; // offer price in INR
  mrp: number; // original price in INR
  inStock: boolean;
  stockCount?: number;
}

export interface NutritionalInfo {
  calories?: string;
  keyNutrients?: string[];
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  description: string;
  categoryId: string;
  sellerId: string;
  images: string[];
  variants: ProductVariant[];
  rating: number;
  reviewCount: number;
  badges: ProductBadge[];
  tags: string[];
  isOrganic: boolean;
  isSeasonal: boolean;
  isBestSeller: boolean;
  isNew: boolean;
  harvestDate: string; // ISO
  origin: string;
  storage: string;
  storageLifeDays: number;
  organicDetails?: string;
  nutrition?: NutritionalInfo;
  deliveryEligible: boolean; // express slot eligible
  createdAt: string; // for "Fresh Today"
  unitsSold?: number;
  prestaShop?: {
    productId: string;
    defaultAttributeId: string;
    categoryIds: string[];
    categoryAncestorIds: string[];
    categorySlugs: string[];
    categoryNames: string[];
    categoryName: string;
    imageIds: string[];
    stockAvailableIds: string[];
    minimumQuantity: number;
    quantity: number;
    unitPrice?: number;
    wholesalePrice?: number;
    active: boolean;
    availableForOrder: boolean;
    visibility: string;
    unit: string;
  };

  /* ---- category-specific attributes (all optional) ---- */
  brand?: string;            // featured brand label
  freshnessNote?: string;    // produce: "Picked 6 hours ago"
  /* fashion */
  sizes?: string[];          // "S" | "M" | "Free Size" ...
  colors?: string[];         // "Marigold", "Indigo" ...
  fabric?: string;           // "Handloom cotton"
  fit?: string;              // "Regular fit"
  /* fertilizers & inputs */
  composition?: string;      // "NPK 4:3:3 + humic acid"
  application?: string;      // dosage / usage instructions
  suitableCrops?: string;    // "Vegetables, fruits, flowers" 
  /* plants */
  potSize?: string;          // "6-inch nursery pot"
  plantHeight?: string;      // "35–45 cm including pot"
  careInstructions?: string; // light/water summary
  /* seeds */
  germinationRate?: string;  // "85–92%"
  sowingSeason?: string;     // "Jun–Sep (kharif)"
}

export type ProductBadge =
  | "organic"
  | "seasonal"
  | "bestseller"
  | "new"
  | "local"
  | "deal"
  | "limited";

/* --------------------------- Taxonomy --------------------------- */

/** Product family that drives card & detail layouts. */
export type ProductKind =
  | "produce"    // fruits, vegetables, leafy greens, herbs
  | "grocery"    // staples, millets, pulses, spices, oils, dairy ...
  | "fashion"    // clothing
  | "agri-input" // fertilizers, composts, boosters, pest control
  | "seed"
  | "plant"
  | "garden"     // tools, pots, grow bags
  | "farm";      // irrigation, equipment, nets

export interface Category {
  id: string;
  slug: string;
  name: string;
  description: string;
  image: string;
  itemCount: number;             // computed from PRODUCTS at build time
  group: string;                 // department id, e.g. "fresh-produce"
  kind: ProductKind;
  icon: LucideIcon;              // decorative icon for menus / chips
  childIds?: string[];           // collection categories (women/men/kids)
  featured?: boolean;            // surfaced on home department grid
}

/** Top-level department used by navigation + mega menu. */
export interface CategoryGroup {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  description: string;
  icon: LucideIcon;
  image: string;
  categoryIds: string[];
}

export interface Seller {
  id: string;
  name: string;
  farmName: string;
  location: string;
  distanceKm: number;
  rating: number;
  reviewCount: number;
  avatar: string;
  cover?: string;
  bio: string;
  since: number;
  isOrganicCertified: boolean;
  certifications: string[];
  productsCount: number;
}

/* ------------------------------ User ---------------------------- */

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatar: string;
  memberSince: string;
  loyaltyPoints: number;
  tier: "sprout" | "grower" | "harvest";
}

export interface Address {
  id: string;
  label: string; // Home / Work / Other
  name: string;
  phone: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  pincode: string;
  type: "home" | "work" | "other";
  isDefault: boolean;
  deliveryInstructions?: string;
}

export interface SavedPaymentMethod {
  id: string;
  type: "card" | "upi" | "wallet";
  label: string;
  masked: string; // "•••• 4242" or "name@upi"
  expiry?: string;
  isDefault: boolean;
}

/* ------------------------------ Cart ---------------------------- */

export interface CartItem {
  id: string; // unique line id: productId:variantId
  productId: string;
  variantId: string;
  quantity: number;
  addedAt: string;
}

export interface CartLine extends CartItem {
  product: Product;
  variant: ProductVariant;
  lineTotal: number;
}

export interface AppliedCoupon {
  code: string;
  description: string;
  discount: number;
  type: "percent" | "flat" | "free-delivery";
  value: number;
}

export interface CartTotals {
  subtotal: number;
  mrpTotal: number;
  savings: number;
  deliveryFee: number;
  handlingFee: number;
  greenFee: number;
  discount: number;
  tax: number;
  total: number;
}

/* ----------------------------- Orders --------------------------- */

export type OrderStatus =
  | "placed"
  | "confirmed"
  | "packed"
  | "out-for-delivery"
  | "delivered"
  | "cancelled"
  | "return-requested"
  | "returned";

export interface OrderItem {
  id: string;
  productId: string;
  variantId: string;
  name: string;
  image: string;
  sellerName: string;
  packLabel: string;
  quantity: number;
  price: number;
  mrp: number;
  lineTotal: number;
}

export interface TrackingEvent {
  id: string;
  status: OrderStatus;
  title: string;
  description: string;
  timestamp: string;
  completed: boolean;
}

export interface Order {
  id: string;
  reference?: string;
  userId: string;
  items: OrderItem[];
  status: OrderStatus;
  placedAt: string;
  deliveredAt?: string;
  scheduledSlot: string;
  address: Address;
  paymentMethod: string;
  paymentId: string;
  paymentStatus?: "pending" | "paid";
  totals: CartTotals;
  couponCode?: string;
  invoiceNo: string;
  tracking: TrackingEvent[];
  canCancel: boolean;
  canReturn: boolean;
  deliveryPartner?: string;
}

/* ----------------------------- Reviews -------------------------- */

export interface Review {
  id: string;
  productId: string;
  userId: string;
  userName: string;
  userAvatar: string;
  rating: number;
  title: string;
  body: string;
  date: string;
  verifiedPurchase: boolean;
  helpfulCount: number;
  images?: string[];
}

export interface RatingBreakdown {
  star: number;
  count: number;
  percent: number;
}

/* ---------------------------- Wishlist -------------------------- */

export interface WishlistEntry {
  productId: string;
  addedAt: string;
  note?: string;
}

/* -------------------------- Notifications ----------------------- */

export type NotificationType = "order" | "offer" | "delivery" | "system" | "price";

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  timestamp: string;
  read: boolean;
  actionLabel?: string;
  actionHref?: string;
}

/* ------------------------- Offers / Coupons --------------------- */

export interface Coupon {
  code: string;
  description: string;
  type: "percent" | "flat" | "free-delivery";
  value: number;
  minOrder: number;
  maxDiscount?: number;
  expiry: string;
  terms: string[];
}

export interface Offer {
  id: string;
  title: string;
  subtitle: string;
  badge?: string;
  image?: string;
  discountLabel: string;
  ctaLabel: string;
  href: string;
  theme: "lime" | "forest" | "emerald" | "amber";
}

/* ------------------------------ Banners ------------------------- */

export interface HeroSlide {
  id: string;
  eyebrow: string;
  title: string;
  subtitle: string;
  ctaLabel: string;
  ctaHref: string;
  image: string;
  stat?: { label: string; value: string };
}

/* --------------------------- Delivery --------------------------- */

export interface DeliverySlot {
  id: string;
  day: string; // "Today" / "Tomorrow" / weekday
  date: string;
  window: string; // "6 AM – 9 AM"
  capacity: "available" | "filling-fast" | "full";
  fee: number;
}

/* ----------------------------- Search --------------------------- */

export interface SearchSuggestion {
  type: "product" | "category" | "term";
  label: string;
  href: string;
  image?: string;
  meta?: string;
}

export interface FilterState {
  categories: string[];
  sellers: string[];
  priceRange: [number, number];
  minRating: number | null;
  availability: "all" | "in-stock";
  organicOnly: boolean;
  seasonalOnly: boolean;
  deliveryEligibleOnly: boolean;
  onSaleOnly: boolean;
}

export type SortOption =
  | "relevance"
  | "price-asc"
  | "price-desc"
  | "rating-desc"
  | "discount-desc"
  | "newest";

/* ------------------------------ Misc ---------------------------- */

export interface FarmerStory {
  id: string;
  sellerId: string;
  name: string;
  farmName: string;
  location: string;
  story: string;
  image: string;
  crops: string[];
}

export interface FAQ {
  question: string;
  answer: string;
}

export interface Testimonial {
  id: string;
  name: string;
  meta: string;
  rating: number;
  quote: string;
}

export type ViewMode = "grid" | "list";
