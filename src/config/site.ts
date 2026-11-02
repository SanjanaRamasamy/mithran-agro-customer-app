import type { LucideIcon } from "lucide-react";
import {
  Home,
  Apple,
  Carrot,
  FlaskConical,
  ShoppingBasket,
  Shirt,
  BadgePercent,
  Tractor,
  Phone,
  Heart,
  ShoppingBasket as BasketIcon,
  Package,
  User,
} from "lucide-react";

export const SITE = {
  name: "Mithren Agro",
  fullName: "Mithren Agro Pvt. Ltd.",
  tagline: "Farm-fresh produce, organic fertilizers, organic groceries and women's apparel — from our farms to your home.",
  description:
    "Mithren Agro Pvt. Ltd. is a farm-direct marketplace for fresh fruits, fresh vegetables, organic fertilizers, organic groceries and handwoven women's apparel — sourced from certified farmers and weaver clusters.",
  supportEmail: "care@mithrenagro.example",
  supportPhone: "+91 98450 12345",
  address: "No. 42, HSR Layout, Bengaluru, Karnataka 560102",
  city: "Bengaluru",
} as const;

/** Primary navigation — exactly the Mithren Agro business lines. */
export const NAV_LINKS: { label: string; href: string; icon?: LucideIcon }[] = [
  { label: "Home", href: "/", icon: Home },
  { label: "Fresh Fruits", href: "/category/fruits", icon: Apple },
  { label: "Fresh Vegetables", href: "/category/vegetables", icon: Carrot },
  { label: "Organic Fertilizers", href: "/category/organic-fertilizers", icon: FlaskConical },
  { label: "Organic Groceries", href: "/category/organic-grocery", icon: ShoppingBasket },
  { label: "Women's Apparels", href: "/category/women", icon: Shirt },
  { label: "Offers", href: "/search?onsale=1", icon: BadgePercent },
  { label: "Our Farms", href: "/farms", icon: Tractor },
  { label: "Contact", href: "/contact", icon: Phone },
];

export const ACCOUNT_LINKS: { label: string; href: string; icon: LucideIcon }[] = [
  { label: "My Orders", href: "/orders", icon: Package },
  { label: "Wishlist", href: "/wishlist", icon: Heart },
  { label: "My Account", href: "/account", icon: User },
  { label: "Cart", href: "/cart", icon: BasketIcon },
];

export const FOOTER_LINKS: { title: string; links: { label: string; href: string }[] }[] = [
  {
    title: "Shop",
    links: [
      { label: "All Products", href: "/search" },
      { label: "Fresh Fruits", href: "/category/fruits" },
      { label: "Fresh Vegetables", href: "/category/vegetables" },
      { label: "Organic Fertilizers", href: "/category/organic-fertilizers" },
      { label: "Organic Groceries", href: "/category/organic-grocery" },
      { label: "Women's Apparels", href: "/category/women" },
      { label: "Offers", href: "/search?onsale=1" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "Our Farms", href: "/farms" },
      { label: "Contact Us", href: "/contact" },
      { label: "Sign In", href: "/login" },
      { label: "My Account", href: "/account" },
      { label: "Order History", href: "/orders" },
    ],
  },
  {
    title: "Our Promise",
    links: [
      { label: "100% Certified Organic", href: "/search" },
      { label: "Farm-Direct Sourcing", href: "/farms" },
      { label: "Weaver-First Fashion", href: "/category/women" },
      { label: "Same-Day Delivery", href: "/" },
      { label: "Secure Payments", href: "/" },
    ],
  },
] as const;

export const BRAND = { name: SITE.name } as const;
