import type { AppNotification, Coupon, Offer } from "@/types";

// Fixed reference time for deterministic server/client rendering.
const MOCK_REFERENCE_TIME = Date.UTC(2026, 10, 15, 7, 0, 0);

const hoursAgo = (hours: number) =>
  new Date(MOCK_REFERENCE_TIME - hours * 3600_000).toISOString();

const daysAhead = (days: number) =>
  new Date(MOCK_REFERENCE_TIME + days * 86_400_000).toISOString();

export const MOCK_NOTIFICATIONS: AppNotification[] = [
  {
    id: "ntf-1",
    type: "delivery",
    title: "Dhruv is 12 minutes away",
    body: "Your order MAG-2026-010423 will arrive between 6–9 PM today. Keep the doorbell on!",
    timestamp: hoursAgo(1),
    read: false,
    actionLabel: "Track order",
    actionHref: "/orders/MAG-2026-010423",
  },
  {
    id: "ntf-2",
    type: "offer",
    title: "Mango season is live 🥭",
    body: "Ratnagiri Alphonso boxes are open for pre-order. FRESH20 gets you 20% off today.",
    timestamp: hoursAgo(5),
    read: false,
    actionLabel: "Shop mangoes",
    actionHref: "/category/fruits",
  },
  {
    id: "ntf-3",
    type: "price",
    title: "Price drop on your wishlist",
    body: "Kanchi Cotton Saree dropped from ₹1,599 to ₹1,150. Grab the loom-fresh batch before it sells out.",
    timestamp: hoursAgo(9),
    read: false,
    actionLabel: "View wishlist",
    actionHref: "/wishlist",
  },
  {
    id: "ntf-4",
    type: "order",
    title: "Order delivered",
    body: "MAG-2026-010380 was delivered yesterday morning. How were the Gala apples?",
    timestamp: hoursAgo(22),
    read: true,
    actionLabel: "Rate produce",
    actionHref: "/orders/MAG-2026-010380",
  },
  {
    id: "ntf-5",
    type: "system",
    title: "New at Sunrise Valley",
    body: "The women-led collective added hill-grown Ooty carrots and Snow Crown cauliflower this week.",
    timestamp: hoursAgo(30),
    read: true,
    actionLabel: "Explore fresh vegetables",
    actionHref: "/category/vegetables",
  },
  {
    id: "ntf-6",
    type: "offer",
    title: "Wallet credited ₹50",
    body: "You earned ₹50 Mithren Agro Wallet cashback from your last organic order.",
    timestamp: hoursAgo(46),
    read: true,
  },
];

export const COUPONS: Coupon[] = [
  {
    code: "FRESH20",
    description: "20% off on orders above ₹399",
    type: "percent",
    value: 20,
    minOrder: 399,
    maxDiscount: 150,
    expiry: daysAhead(12),
    terms: [
      "Valid once per user on orders above ₹399.",
      "Maximum discount ₹150 per order.",
      "Applicable on all fruits, vegetables and boxes.",
    ],
  },
  {
    code: "GREEN50",
    description: "Flat ₹50 off on orders above ₹499",
    type: "flat",
    value: 50,
    minOrder: 499,
    expiry: daysAhead(30),
    terms: [
      "Flat ₹50 discount on orders above ₹499.",
      "Not applicable with other coupons.",
      "Valid on all deliveries including express.",
    ],
  },
  {
    code: "ZEROWASTE",
    description: "Free delivery on any order",
    type: "free-delivery",
    value: 0,
    minOrder: 0,
    expiry: daysAhead(60),
    terms: [
      "Removes the delivery fee entirely.",
      "Reusable crate programme participants only (simulated).",
    ],
  },
  {
    code: "AGRI15",
    description: "15% off fertilizers & bio inputs above ₹999",
    type: "percent",
    value: 15,
    minOrder: 999,
    maxDiscount: 500,
    expiry: daysAhead(20),
    terms: [
      "Valid on organic fertilizers, composts and bio plant boosters.",
      "Maximum discount ₹500 per order.",
      "Not applicable with other coupons.",
    ],
  },
  {
    code: "MANGO10",
    description: "10% off mango boxes above ₹999",
    type: "percent",
    value: 10,
    minOrder: 999,
    maxDiscount: 200,
    expiry: daysAhead(5),
    terms: ["Valid on Alphonso dozen boxes only.", "Maximum discount ₹200.", "Season-limited stock."],
  },
];

export const OFFERS: Offer[] = [
  {
    id: "of-1",
    title: "Mango Season Opening",
    subtitle: "Carbide-free Ratnagiri Alphonso, pre-order open",
    badge: "Season Limited",
    discountLabel: "10% OFF",
    ctaLabel: "Pre-order box",
    href: "/category/fruits",
    theme: "amber",
  },
  {
    id: "of-2",
    title: "Zero-Waste Week",
    subtitle: "Free delivery on every reusable-crate order",
    discountLabel: "FREE SHIP",
    ctaLabel: "Use ZEROWASTE",
    href: "/search",
    theme: "emerald",
  },
  {
    id: "of-3",
    title: "First Harvest Club",
    subtitle: "New members get 20% off their first basket",
    discountLabel: "20% OFF",
    ctaLabel: "Join free",
    href: "/login",
    theme: "lime",
  },
  {
    id: "of-4",
    title: "Monsoon Agri Fest",
    subtitle: "Organic fertilizers & bio inputs at dealer prices",
    badge: "Agri Week",
    discountLabel: "UP TO 45%",
    ctaLabel: "Shop inputs",
    href: "/category/organic-fertilizers",
    theme: "forest",
  },
  {
    id: "of-5",
    title: "Handloom Saree Festival",
    subtitle: "Kanjivaram & cotton weaves straight from the loom",
    discountLabel: "30% OFF",
    ctaLabel: "Shop sarees",
    href: "/category/women",
    theme: "amber",
  },
  {
    id: "of-6",
    title: "Pantry Essentials",
    subtitle: "Organic rice, atta and millet flour from ₹95",
    discountLabel: "FROM ₹95",
    ctaLabel: "Shop groceries",
    href: "/category/organic-grocery",
    theme: "emerald",
  },
];
