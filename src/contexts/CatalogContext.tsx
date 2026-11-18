"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { Product } from "@/types";
import {
  mapPrestaShopProduct,
  parsePrestaShopCategories,
  type PrestaShopCategory,
} from "@/lib/prestashop-catalog";
import { parseFarms, productFarmIndex, type Farm } from "@/lib/farms";

type CatalogStatus = "loading" | "ready" | "error";
/** "unavailable" = the module did not return a farm directory (not installed/configured or down). */
export type FarmsStatus = "loading" | "ready" | "unavailable";

interface CatalogContextValue {
  products: Product[];
  categories: PrestaShopCategory[];
  categoriesError: string | null;
  farms: Farm[];
  farmBySlug: Record<string, Farm>;
  farmsStatus: FarmsStatus;
  status: CatalogStatus;
  error: string | null;
  reload: () => void;
}

interface CatalogData {
  products: Product[];
  categories: PrestaShopCategory[];
  categoriesError: string | null;
  farms: Farm[];
  farmsAvailable: boolean;
}

const CatalogContext = createContext<CatalogContextValue | null>(null);
let catalogRequest: Promise<CatalogData> | null = null;

async function fetchFarms(): Promise<{ farms: Farm[]; available: boolean }> {
  try {
    const response = await fetch("/api/farms", { cache: "no-store" });
    const payload: unknown = await response.json();
    if (!response.ok || !isRecord(payload) || payload.success !== true) {
      return { farms: [], available: false };
    }
    return { farms: parseFarms(payload.farms), available: true };
  } catch {
    return { farms: [], available: false };
  }
}

function fetchCatalogData(): Promise<CatalogData> {
  if (catalogRequest) return catalogRequest;

  const request = (async () => {
    const [productsResponse, categoriesResult, farmsResult] = await Promise.all([
      fetch("/api/prestashop/products", { cache: "no-store" }),
      (async () => {
        try {
          const response = await fetch("/api/prestashop/categories", { cache: "no-store" });
          if (!response.ok) throw new Error("Categories are temporarily unavailable.");
          const payload: unknown = await response.json();
          if (
            !isRecord(payload) ||
            payload.success !== true ||
            !Array.isArray(payload.categories)
          ) {
            throw new Error("Categories are temporarily unavailable.");
          }
          return {
            categories: parsePrestaShopCategories(payload.categories),
            error: null,
          };
        } catch {
          return {
            categories: [] as PrestaShopCategory[],
            error: "Categories are temporarily unavailable.",
          };
        }
      })(),
      fetchFarms(),
    ]);

    const productsPayload: unknown = await productsResponse.json();
    if (
      !productsResponse.ok ||
      !isRecord(productsPayload) ||
      productsPayload.success !== true ||
      !Array.isArray(productsPayload.products)
    ) {
      throw new Error("Products are temporarily unavailable.");
    }

    const farmIndex = productFarmIndex(farmsResult.farms);
    const mappedProducts = productsPayload.products
      .map((product) => mapPrestaShopProduct(product, categoriesResult.categories))
      .filter((product): product is Product => Boolean(product))
      .filter((product) =>
        product.prestaShop?.active === true && product.prestaShop.visibility !== "none"
      )
      // sellerId is the farm slug assigned in the module, or "" when unassigned.
      .map((product) => ({ ...product, sellerId: farmIndex.get(product.id) ?? "" }));

    // Only keep farm product IDs that are actually live in the catalogue.
    const liveIds = new Set(mappedProducts.map((product) => product.id));
    const farms = farmsResult.farms.map((farm) => ({
      ...farm,
      productIds: farm.productIds.filter((id) => liveIds.has(id)),
    }));

    return {
      products: mappedProducts,
      categories: categoriesResult.categories,
      categoriesError: categoriesResult.error,
      farms,
      farmsAvailable: farmsResult.available,
    };
  })();

  catalogRequest = request;
  void request.then(
    () => { if (catalogRequest === request) catalogRequest = null; },
    () => { if (catalogRequest === request) catalogRequest = null; }
  );
  return request;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function CatalogProvider({ children }: { children: React.ReactNode }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<PrestaShopCategory[]>([]);
  const [categoriesError, setCategoriesError] = useState<string | null>(null);
  const [farms, setFarms] = useState<Farm[]>([]);
  const [farmsStatus, setFarmsStatus] = useState<FarmsStatus>("loading");
  const [status, setStatus] = useState<CatalogStatus>("loading");
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;

    async function loadCatalog() {
      setStatus("loading");
      setFarmsStatus("loading");
      setError(null);
      try {
        const catalog = await fetchCatalogData();
        if (!active) return;
        setCategories(catalog.categories);
        setCategoriesError(catalog.categoriesError);
        setProducts(catalog.products);
        setFarms(catalog.farms);
        setFarmsStatus(catalog.farmsAvailable ? "ready" : "unavailable");
        setStatus("ready");
      } catch (loadError) {
        if (!active) return;
        setError(loadError instanceof Error ? loadError.message : "Unable to load products.");
        setFarmsStatus("unavailable");
        setStatus("error");
      }
    }

    void loadCatalog();
    return () => { active = false; };
  }, [attempt]);

  const reload = useCallback(() => setAttempt((value) => value + 1), []);
  const farmBySlug = useMemo(
    () => Object.fromEntries(farms.map((farm) => [farm.slug, farm])),
    [farms]
  );
  const value = useMemo(
    () => ({ products, categories, categoriesError, farms, farmBySlug, farmsStatus, status, error, reload }),
    [products, categories, categoriesError, farms, farmBySlug, farmsStatus, status, error, reload]
  );

  return <CatalogContext.Provider value={value}>{children}</CatalogContext.Provider>;
}

export function useCatalog(): CatalogContextValue {
  const context = useContext(CatalogContext);
  if (!context) throw new Error("useCatalog must be used inside <CatalogProvider>");
  return context;
}
