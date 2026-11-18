"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { AppliedCoupon, CartItem, CartLine, CartTotals, Product } from "@/types";
import { useCatalog } from "@/contexts/CatalogContext";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/NotificationContext";
import { COUPONS } from "@/data/offers";
import { makeCartItemId } from "@/utils/product";
import { readStorage, removeStorage, writeStorage } from "@/utils/storage";
import { mergeCustomerCart, parseCustomerCart } from "@/utils/customer-sync";
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
    const variant = product.variants.find((v) => v.id === item.variantId) ??
      (item.variantId === `prestashop-${item.productId}` && product.variants.length === 1
        ? product.variants[0]
        : undefined);
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
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const productsById = useMemo(
    () => Object.fromEntries(products.map((product) => [product.id, product])),
    [products]
  );
  const [items, setItems] = useState<CartItem[]>([]);
  const [savedForLater, setSavedForLater] = useState<CartItem[]>([]);
  const [couponCode, setCouponCode] = useState<string | null>(null);
  const [isDrawerOpen, setDrawerOpen] = useState(false);
  const [storageOwner, setStorageOwner] = useState<string | null | undefined>(undefined);
  const persistenceQueue = useRef<Promise<void>>(Promise.resolve());
  const currentUserId = useRef<string | null>(user?.id ?? null);
  const hasCurrentStorage = storageOwner === (user?.id ?? null);
  const visibleItems = hasCurrentStorage ? items : [];
  const visibleSavedForLater = hasCurrentStorage ? savedForLater : [];

  useEffect(() => {
    currentUserId.current = user?.id ?? null;
  }, [user?.id]);

  useEffect(() => {
    if (authLoading) return;
    let cancelled = false;
    const customerId = user?.id ?? null;
    setStorageOwner(undefined);

    if (!customerId) {
      setItems(readStorage<CartItem[]>(CART_KEY, []));
      setSavedForLater(readStorage<CartItem[]>(SAVED_KEY, []));
      setCouponCode(readStorage<string | null>(COUPON_KEY, null));
      setStorageOwner(null);
      return () => {
        cancelled = true;
      };
    }

    setCouponCode(null);
    const loadCustomerCart = async () => {
      try {
        const response = await fetch("/api/customer/cart", { cache: "no-store" });
        const payload: unknown = await response.json();
        if (
          !response.ok ||
          typeof payload !== "object" ||
          payload === null ||
          !("items" in payload)
        ) {
          throw new Error("Unable to load your saved basket.");
        }
        const remoteItems = parseCustomerCart(payload.items);
        if (!remoteItems) throw new Error("Your saved basket could not be read.");

        const guestRaw: unknown = readStorage<unknown>(CART_KEY, []);
        const guestItems = parseCustomerCart(guestRaw);
        let nextItems = remoteItems;
        if (guestItems && guestItems.length > 0) {
          const merged = mergeCustomerCart(remoteItems, guestItems);
          const saveResponse = await fetch("/api/customer/cart", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            cache: "no-store",
            body: JSON.stringify({ items: merged }),
          });
          const savePayload: unknown = await saveResponse.json();
          const savedItems =
            typeof savePayload === "object" &&
            savePayload !== null &&
            "items" in savePayload
              ? parseCustomerCart(savePayload.items)
              : null;
          if (!saveResponse.ok || !savedItems) {
            toast({
              kind: "error",
              title: "Your guest basket could not be merged. It remains saved in this browser.",
            });
          } else {
            nextItems = savedItems;
            removeStorage(CART_KEY);
          }
        } else if (guestRaw !== null && guestItems === null) {
          toast({
            kind: "error",
            title: "Some guest basket items could not be synced. They remain saved in this browser.",
          });
        }

        if (!cancelled) {
          setItems(nextItems);
          setSavedForLater(readStorage<CartItem[]>(SAVED_KEY, []));
          setStorageOwner(customerId);
        }
      } catch {
        if (!cancelled) {
          toast({
            kind: "error",
            title: "Your saved basket could not be loaded from your account.",
          });
        }
      }
    };
    void loadCustomerCart();
    return () => {
      cancelled = true;
    };
  }, [authLoading, user?.id, toast]);

  useEffect(() => {
    if (storageOwner === null && !user) writeStorage(CART_KEY, items);
    if (storageOwner && storageOwner === user?.id) {
      const ownerId = storageOwner;
      const snapshot = JSON.stringify({ items });
      persistenceQueue.current = persistenceQueue.current
        .catch(() => undefined)
        .then(async () => {
          if (currentUserId.current !== ownerId) return;
          const response = await fetch("/api/customer/cart", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            cache: "no-store",
            body: snapshot,
          });
          if (!response.ok) throw new Error("Basket synchronization failed.");
        })
        .catch(() => {
          if (currentUserId.current === ownerId) {
            toast({
              kind: "error",
              title: "Your basket changes could not be synced to your account.",
            });
          }
        });
    }
  }, [items, storageOwner, user?.id, toast]);
  useEffect(() => {
    if (storageOwner === null && !user) writeStorage(SAVED_KEY, savedForLater);
  }, [savedForLater, storageOwner, user]);
  useEffect(() => {
    if (storageOwner === null && !user) writeStorage(COUPON_KEY, couponCode);
  }, [couponCode, storageOwner, user]);

  const lines = useMemo(() => resolveLines(visibleItems, productsById), [visibleItems, productsById]);
  const savedLines = useMemo(() => resolveLines(visibleSavedForLater, productsById), [visibleSavedForLater, productsById]);

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
      if (!hasCurrentStorage) {
        return { ok: false, message: "Your saved basket is still loading." };
      }
      const product = productsById[productId];
      const variant = product?.variants.find((v) => v.id === variantId);
      if (!product || !variant) return { ok: false, message: "Product unavailable" };
      if (!product.prestaShop?.active || !product.prestaShop.availableForOrder) {
        return { ok: false, message: `${product.name} is unavailable for order` };
      }
      if (!variant.inStock) return { ok: false, message: `${product.name} is out of stock` };

      const id = makeCartItemId(productId, variantId);
      const existing = visibleItems.find((item) =>
        item.productId === productId &&
        (item.variantId === variantId || item.variantId === `prestashop-${productId}`)
      );
      const requestedQuantity = Math.max(product.prestaShop.minimumQuantity, quantity);
      const nextQuantity = requestedQuantity + (existing?.quantity ?? 0);
      if (nextQuantity > product.prestaShop.quantity) {
        return { ok: false, message: `Only ${product.prestaShop.quantity} ${product.prestaShop.unit || "units"} available` };
      }

      setItems((prev) => {
        if (existing) {
          return prev.map((i) =>
            i.id === existing.id
              ? { ...i, id, variantId, quantity: nextQuantity }
              : i
          );
        }
        return [
          ...prev,
          { id, productId, variantId, quantity: requestedQuantity, addedAt: new Date().toISOString() },
        ];
      });
      return { ok: true, message: `${product.name} added to basket` };
    },
    [hasCurrentStorage, visibleItems, productsById]
  );

  const updateQuantity = useCallback((id: string, quantity: number) => {
    if (!hasCurrentStorage) return;
    if (quantity <= 0) {
      setItems((prev) => prev.filter((i) => i.id !== id));
      return;
    }
    const item = visibleItems.find((candidate) => candidate.id === id);
    const product = item ? productsById[item.productId] : undefined;
    const variant = product?.variants.find((candidate) => candidate.id === item?.variantId) ??
      (item?.variantId === `prestashop-${item?.productId}` && product?.variants.length === 1
        ? product.variants[0]
        : undefined);
    if (!item || !product || !variant) return;
    const minimum = product.prestaShop?.minimumQuantity ?? 1;
    const maximum = variant.stockCount ?? 10;
    if (maximum < minimum) return;
    setItems((prev) => prev.map((candidate) =>
      candidate.id === id ? { ...candidate, quantity: Math.max(minimum, Math.min(maximum, quantity)) } : candidate
    ));
  }, [hasCurrentStorage, visibleItems, productsById]);

  const removeItem = useCallback((id: string) => {
    if (!hasCurrentStorage) return;
    setItems((prev) => prev.filter((i) => i.id !== id));
  }, [hasCurrentStorage]);

  const clearCart = useCallback(() => {
    if (!hasCurrentStorage) return;
    setItems([]);
    setCouponCode(null);
  }, [hasCurrentStorage]);

  const saveForLater = useCallback((id: string) => {
    if (!hasCurrentStorage) return;
    setItems((prev) => {
      const item = prev.find((i) => i.id === id);
      if (item) setSavedForLater((s) => (s.some((x) => x.id === id) ? s : [...s, item]));
      return prev.filter((i) => i.id !== id);
    });
  }, [hasCurrentStorage]);

  const moveToCart = useCallback((id: string) => {
    if (!hasCurrentStorage) return;
    const item = visibleSavedForLater.find((candidate) => candidate.id === id);
    const product = item ? productsById[item.productId] : undefined;
    const variant = item && (
      product?.variants.find((candidate) => candidate.id === item.variantId) ??
      (item.variantId === `prestashop-${item.productId}` && product?.variants.length === 1
        ? product.variants[0]
        : undefined)
    );
    if (!item || !product || !variant?.inStock || !product.prestaShop?.availableForOrder) return;

    const minimum = product.prestaShop.minimumQuantity;
    const quantity = Math.max(minimum, item.quantity);
    const existing = visibleItems.find((candidate) => candidate.id === id);
    const nextQuantity = quantity + (existing?.quantity ?? 0);
    if (nextQuantity > product.prestaShop.quantity) return;

    setItems((current) => existing
      ? current.map((candidate) => candidate.id === id ? { ...candidate, quantity: nextQuantity } : candidate)
      : [...current, { ...item, quantity }]
    );
    setSavedForLater((current) => current.filter((candidate) => candidate.id !== id));
  }, [hasCurrentStorage, visibleItems, productsById, visibleSavedForLater]);

  const removeSaved = useCallback((id: string) => {
    if (!hasCurrentStorage) return;
    setSavedForLater((prev) => prev.filter((i) => i.id !== id));
  }, [hasCurrentStorage]);

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
      items: visibleItems,
      savedForLater: visibleSavedForLater,
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
      visibleItems,
      visibleSavedForLater,
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
