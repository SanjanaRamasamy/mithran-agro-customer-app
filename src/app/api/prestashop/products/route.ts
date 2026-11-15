import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type JsonRecord = Record<string, unknown>;

function isRecord(value: unknown): value is JsonRecord {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}

/**
 * Supports common PrestaShop JSON response formats:
 *
 * 1. { products: [...] }
 * 2. { products: { product: [...] } }
 * 3. { products: { product: {...} } }
 * 4. { prestashop: { products: [...] } }
 * 5. { prestashop: { products: { product: [...] } } }
 */
function extractProducts(payload: unknown): unknown[] | null {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (!isRecord(payload)) {
    return null;
  }

  const root = isRecord(payload.prestashop)
    ? payload.prestashop
    : payload;

  const products = root.products ?? root.product;

  if (products === "") {
    return [];
  }

  if (Array.isArray(products)) {
    return products;
  }

  if (isRecord(products)) {
    const productCollection = products.product;

    if (Array.isArray(productCollection)) {
      return productCollection;
    }

    if (isRecord(productCollection)) {
      return Object.keys(productCollection).length === 0
        ? []
        : [productCollection];
    }

    if (productCollection === "") {
      return [];
    }

    if (Object.keys(products).length === 0) {
      return [];
    }
  }

  return null;
}

export async function GET() {
  try {
    const baseUrl = process.env.PRESTASHOP_BASE_URL?.trim();
    const apiKey = process.env.PRESTASHOP_API_KEY?.trim();

    if (!baseUrl || !apiKey) {
      return NextResponse.json(
        {
          success: false,
          message: "PrestaShop environment configuration is missing.",
          products: [],
        },
        { status: 500 }
      );
    }

    // Preserve any subdirectory in the configured base URL.
    const normalizedBaseUrl = baseUrl.endsWith("/")
      ? baseUrl
      : `${baseUrl}/`;

    const endpoint = new URL("api/products", normalizedBaseUrl);

    endpoint.searchParams.set("output_format", "JSON");
    endpoint.searchParams.set("display", "full");

    // PrestaShop Webservice authentication:
    // API key is the username and the password is blank.
    const authorization = Buffer.from(`${apiKey}:`).toString("base64");

    const response = await fetch(endpoint.toString(), {
      method: "GET",
      headers: {
        Authorization: `Basic ${authorization}`,
        Accept: "application/json",
      },
      cache: "no-store",
    });

    const contentType = response.headers.get("content-type") ?? "";

    if (!response.ok) {
      const message =
        response.status === 401
          ? "PrestaShop authentication failed."
          : response.status === 403
            ? "PrestaShop denied access to products."
            : response.status === 404
              ? "PrestaShop products endpoint was not found."
              : response.status >= 500
                ? "PrestaShop encountered a server error."
                : "Unable to retrieve products from PrestaShop.";

      console.error("PrestaShop Products API request failed:", {
        status: response.status,
        contentType,
      });

      return NextResponse.json(
        {
          success: false,
          message,
          upstreamStatus: response.status,
          products: [],
        },
        { status: 502 }
      );
    }

    const responseText = await response.text();

    let data: unknown;

    try {
      data = JSON.parse(responseText);
    } catch {
      console.error("PrestaShop returned a non-JSON products response:", {
        status: response.status,
        contentType,
      });

      return NextResponse.json(
        {
          success: false,
          message: "PrestaShop returned an invalid JSON response.",
          products: [],
        },
        { status: 502 }
      );
    }

    const products = extractProducts(data);

    if (products === null) {
      console.error("Unable to identify products in PrestaShop response:", {
        contentType,
        rootKeys: isRecord(data) ? Object.keys(data) : [],
        responseType: Array.isArray(data) ? "array" : typeof data,
      });

      return NextResponse.json(
        {
          success: false,
          message: "Unable to identify the products collection in the PrestaShop response.",
          products: [],
        },
        { status: 502 }
      );
    }

    const hasProducts = products.length > 0;

    return NextResponse.json({
      success: true,
      connected: true,
      message: hasProducts
        ? "Products retrieved successfully."
        : "PrestaShop connected successfully. No products are available yet.",
      total: products.length,
      products,
    });
  } catch (error) {
    console.error("Products API unexpected error:", {
      errorType: error instanceof Error ? error.name : typeof error,
    });

    return NextResponse.json(
      {
        success: false,
        message: "Unable to connect to PrestaShop or retrieve products.",
        products: [],
      },
      { status: 502 }
    );
  }
}

function isEnabled(value: unknown): boolean {
  return value === true || value === 1 || value === "1";
}

function numberValue(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
}

export async function POST(request: Request) {
  try {
    const body: unknown = await request.json();
    if (!isRecord(body) || !Array.isArray(body.items) || body.items.length === 0) {
      return NextResponse.json(
        { success: false, message: "A non-empty basket is required for validation." },
        { status: 400 }
      );
    }

    const requestedItems = new Map<string, { productId: string; quantity: number; expectedPrice: number }>();
    for (const item of body.items) {
      if (!isRecord(item)) {
        return NextResponse.json({ success: false, message: "Invalid basket item." }, { status: 400 });
      }
      const productId = typeof item.productId === "string" ? item.productId : "";
      const quantity = numberValue(item.quantity);
      const expectedPrice = numberValue(item.expectedPrice);
      if (
        !/^\d+$/.test(productId) ||
        !quantity ||
        quantity < 1 ||
        !Number.isSafeInteger(quantity) ||
        expectedPrice === undefined ||
        expectedPrice < 0
      ) {
        return NextResponse.json({ success: false, message: "Invalid basket item." }, { status: 400 });
      }
      const existing = requestedItems.get(productId);
      if (existing && Math.abs(existing.expectedPrice - expectedPrice) > 0.000001) {
        return NextResponse.json({ success: false, message: "Invalid basket item." }, { status: 400 });
      }
      const combinedQuantity = quantity + (existing?.quantity ?? 0);
      if (!Number.isSafeInteger(combinedQuantity)) {
        return NextResponse.json({ success: false, message: "Invalid basket quantity." }, { status: 400 });
      }
      requestedItems.set(productId, {
        productId,
        quantity: combinedQuantity,
        expectedPrice,
      });
    }

    const catalogResponse = await GET();
    const catalogPayload: unknown = await catalogResponse.json();
    if (
      !catalogResponse.ok ||
      !isRecord(catalogPayload) ||
      catalogPayload.success !== true ||
      !Array.isArray(catalogPayload.products)
    ) {
      return NextResponse.json(
        { success: false, message: "Unable to verify current PrestaShop inventory." },
        { status: 502 }
      );
    }

    for (const item of requestedItems.values()) {
      const product = catalogPayload.products.find(
        (candidate) => isRecord(candidate) && String(candidate.id) === item.productId
      );
      if (!isRecord(product)) {
        return NextResponse.json(
          { success: false, message: "A basket product is no longer available." },
          { status: 409 }
        );
      }

      const stock = numberValue(product.quantity) ?? 0;
      const minimum = Math.max(1, numberValue(product.minimal_quantity) ?? 1);
      const price = numberValue(product.price);
      if (
        !isEnabled(product.active) ||
        !isEnabled(product.available_for_order) ||
        product.visibility === "none"
      ) {
        return NextResponse.json(
          { success: false, message: "A basket product is no longer available to order." },
          { status: 409 }
        );
      }
      if (item.quantity < minimum || item.quantity > stock) {
        return NextResponse.json(
          { success: false, message: "A basket quantity no longer meets the minimum or available stock." },
          { status: 409 }
        );
      }
      if (price === undefined || Math.abs(price - item.expectedPrice) > 0.000001) {
        return NextResponse.json(
          { success: false, message: "A product price has changed. Review your basket." },
          { status: 409 }
        );
      }
    }

    return NextResponse.json({ success: true, valid: true });
  } catch {
    return NextResponse.json(
      { success: false, message: "Unable to validate the basket with PrestaShop." },
      { status: 502 }
    );
  }
}