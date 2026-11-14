"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { AppliedCoupon, CartItem, CartLine, CartTotals, Product } from "@/types";
import { useCatalog } from "@/contexts/CatalogContext";
import { COUPONS } from "@/data/offers";
import { makeCartItemId } from "@/utils/product";
import { readStorage, writeStorage } from "@/utils/storage";
import {
  DELIVERY_FEE,
  FREE_DELIVERY_THRESHOLD,
  GREEN_FEE,
  HANDLING_FEE,
  TAX_RATE,
} from "@/constants";

const CART_KEY = "verdant.cart.v1";
const SAVED_KEY = "verdant.saved.v1";
const COUPON_KEY = "verdant.coupon.v1";

interface AddResult {
  ok: boolean;
  message: string;
}

interface CartContextValue {
  items: CartItem[];
  savedForLater: CartItem[];
  lines: CartLine[];
  savedLines: CartLine[];
  totals: CartTotals;
  coupon: AppliedCoupon | null;
  itemCount: number;
  isDrawerOpen: boolean;
  setDrawerOpen: (open: boolean) => void;
  openDrawer: () => void;
  closeDrawer: () => void;
  addItem: (productId: string, variantId: string, quantity?: number) => AddResult;
  updateQuantity: (id: string, quantity: number) => void;
  removeItem: (id: string) => void;
  clearCart: () => void;
  saveForLater: (id: string) => void;
  moveToCart: (id: string) => void;
  removeSaved: (id: string) => void;
  applyCoupon: (code: string) => AddResult;
  removeCoupon: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

function resolveLines(
  items: CartItem[],
  productsById: Record<string, Product>
): CartLine[] {
  return items.flatMap((item) => {
    const product = productsById[item.productId];
    if (!product) return [];
    const variant = product.variants.find((v) => v.id === item.variantId);
    if (!variant) return [];
    return [{ ...item, product, variant, lineTotal: variant.price * item.quantity }];
  });
}

function computeTotals(
  lines: CartLine[],
  coupon: AppliedCoupon | null
): CartTotals {
  const subtotal = lines.reduce((sum, l) => sum + l.lineTotal, 0);
  const mrpTotal = lines.reduce((sum, l) => sum + l.variant.mrp * l.quantity, 0);
  const discount = coupon?.discount ?? 0;
  const deliveryFee =
    subtotal === 0 || subtotal >= FREE_DELIVERY_THRESHOLD || coupon?.type === "free-delivery"
      ? 0
      : DELIVERY_FEE;
  const handlingFee = subtotal === 0 ? 0 : HANDLING_FEE;
  const greenFee = subtotal === 0 ? 0 : GREEN_FEE;
  const taxable = Math.max(0, subtotal - discount);
  const tax = subtotal === 0 ? 0 : Math.round(taxable * TAX_RATE);
  const total = Math.max(0, taxable + deliveryFee + handlingFee + greenFee + tax);
  return {
    subtotal,
    mrpTotal,
    savings: mrpTotal - subtotal,
    deliveryFee,
    handlingFee,
    greenFee,
    discount,
    tax,
    total,
  };
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { products } = useCatalog();
  const productsById = useMemo(
    () => Object.fromEntries(products.map((product) => [product.id, product])),
    [products]
  );
  const [items, setItems] = useState<CartItem[]>([]);
  const [savedForLater, setSavedForLater] = useState<CartItem[]>([]);
  const [couponCode, setCouponCode] = useState<string | null>(null);
  const [isDrawerOpen, setDrawerOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setItems(readStorage<CartItem[]>(CART_KEY, []));
    setSavedForLater(readStorage<CartItem[]>(SAVED_KEY, []));
    setCouponCode(readStorage<string | null>(COUPON_KEY, null));
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) writeStorage(CART_KEY, items);
  }, [items, hydrated]);
  useEffect(() => {
    if (hydrated) writeStorage(SAVED_KEY, savedForLater);
  }, [savedForLater, hydrated]);
  useEffect(() => {
    if (hydrated) writeStorage(COUPON_KEY, couponCode);
  }, [couponCode, hydrated]);

  const lines = useMemo(() => resolveLines(items, productsById), [items, productsById]);
  const savedLines = useMemo(() => resolveLines(savedForLater, productsById), [savedForLater, productsById]);

  const coupon = useMemo<AppliedCoupon | null>(() => {
    if (!couponCode) return null;
    const c = COUPONS.find((x) => x.code === couponCode);
    if (!c) return null;
    const subtotal = lines.reduce((s, l) => s + l.lineTotal, 0);
    let discount = 0;
    if (c.type === "percent") {
      discount = Math.min(Math.round((subtotal * c.value) / 100), c.maxDiscount ?? Infinity);
    } else if (c.type === "flat") {
      discount = Math.min(c.value, subtotal);
    }
    return { code: c.code, description: c.description, discount, type: c.type, value: c.value };
  }, [couponCode, lines]);

  const totals = useMemo(() => computeTotals(lines, coupon), [lines, coupon]);

  const openDrawer = useCallback(() => setDrawerOpen(true), []);
  const closeDrawer = useCallback(() => setDrawerOpen(false), []);

  const addItem = useCallback(
    (productId: string, variantId: string, quantity = 1): AddResult => {
      const product = productsById[productId];
      const variant = product?.variants.find((v) => v.id === variantId);
      if (!product || !variant) return { ok: false, message: "Product unavailable" };
      if (!product.prestaShop?.active || !product.prestaShop.availableForOrder) {
        return { ok: false, message: `${product.name} is unavailable for order` };
      }
      if (!variant.inStock) return { ok: false, message: `${product.name} is out of stock` };

      const id = makeCartItemId(productId, variantId);
      const existing = items.find((item) => item.id === id);
      const requestedQuantity = Math.max(product.prestaShop.minimumQuantity, quantity);
      const nextQuantity = requestedQuantity + (existing?.quantity ?? 0);
      if (nextQuantity > product.prestaShop.quantity) {
        return { ok: false, message: `Only ${product.prestaShop.quantity} ${product.prestaShop.unit || "units"} available` };
      }

      setItems((prev) => {
        if (existing) {
          return prev.map((i) =>
            i.id === id ? { ...i, quantity: nextQuantity } : i
          );
        }
        return [
          ...prev,
          { id, productId, variantId, quantity: requestedQuantity, addedAt: new Date().toISOString() },
        ];
      });
      return { ok: true, message: `${product.name} added to basket` };
    },
    [items, productsById]
  );

  const updateQuantity = useCallback((id: string, quantity: number) => {
    if (quantity <= 0) {
      setItems((prev) => prev.filter((i) => i.id !== id));
      return;
    }
    const item = items.find((candidate) => candidate.id === id);
    const product = item ? productsById[item.productId] : undefined;
    const variant = product?.variants.find((candidate) => candidate.id === item?.variantId);
    if (!item || !product || !variant) return;
    const minimum = product.prestaShop?.minimumQuantity ?? 1;
    const maximum = variant.stockCount ?? 10;
    if (maximum < minimum) return;
    setItems((prev) => prev.map((candidate) =>
      candidate.id === id ? { ...candidate, quantity: Math.max(minimum, Math.min(maximum, quantity)) } : candidate
    ));
  }, [items, productsById]);

  const removeItem = useCallback((id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
    setCouponCode(null);
  }, []);

  const saveForLater = useCallback((id: string) => {
    setItems((prev) => {
      const item = prev.find((i) => i.id === id);
      if (item) setSavedForLater((s) => (s.some((x) => x.id === id) ? s : [...s, item]));
      return prev.filter((i) => i.id !== id);
    });
  }, []);

  const moveToCart = useCallback((id: string) => {
    const item = savedForLater.find((candidate) => candidate.id === id);
    const product = item ? productsById[item.productId] : undefined;
    const variant = item && product?.variants.find((candidate) => candidate.id === item.variantId);
    if (!item || !product || !variant?.inStock || !product.prestaShop?.availableForOrder) return;

    const minimum = product.prestaShop.minimumQuantity;
    const quantity = Math.max(minimum, item.quantity);
    const existing = items.find((candidate) => candidate.id === id);
    const nextQuantity = quantity + (existing?.quantity ?? 0);
    if (nextQuantity > product.prestaShop.quantity) return;

    setItems((current) => existing
      ? current.map((candidate) => candidate.id === id ? { ...candidate, quantity: nextQuantity } : candidate)
      : [...current, { ...item, quantity }]
    );
    setSavedForLater((current) => current.filter((candidate) => candidate.id !== id));
  }, [items, productsById, savedForLater]);

  const removeSaved = useCallback((id: string) => {
    setSavedForLater((prev) => prev.filter((i) => i.id !== id));
  }, []);

  const applyCoupon = useCallback(
    (code: string): AddResult => {
      const c = COUPONS.find((x) => x.code.toUpperCase() === code.trim().toUpperCase());
      if (!c) return { ok: false, message: "Invalid coupon code. Try FRESH20 or GREEN50." };
      const subtotal = lines.reduce((s, l) => s + l.lineTotal, 0);
      if (subtotal < c.minOrder) {
        return {
          ok: false,
          message: `Add items worth ₹${Math.ceil(c.minOrder - subtotal)} more to use ${c.code}.`,
        };
      }
      setCouponCode(c.code);
      return { ok: true, message: `${c.code} applied — ${c.description}` };
    },
    [lines]
  );

  const removeCoupon = useCallback(() => setCouponCode(null), []);

  const itemCount = useMemo(() => lines.reduce((sum, line) => sum + line.quantity, 0), [lines]);

  const value = useMemo<CartContextValue>(
    () => ({
      items,
      savedForLater,
      lines,
      savedLines,
      totals,
      coupon,
      itemCount,
      isDrawerOpen,
      setDrawerOpen,
      openDrawer,
      closeDrawer,
      addItem,
      updateQuantity,
      removeItem,
      clearCart,
      saveForLater,
      moveToCart,
      removeSaved,
      applyCoupon,
      removeCoupon,
    }),
    [
      items,
      savedForLater,
      lines,
      savedLines,
      totals,
      coupon,
      itemCount,
      isDrawerOpen,
      openDrawer,
      closeDrawer,
      addItem,
      updateQuantity,
      removeItem,
      clearCart,
      saveForLater,
      moveToCart,
      removeSaved,
      applyCoupon,
      removeCoupon,
    ]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside <CartProvider>");
  return ctx;
}
