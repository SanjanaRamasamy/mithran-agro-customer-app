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

  if (Array.isArray(products)) {
    return products;
  }

  if (isRecord(products)) {
    const productCollection = products.product;

    if (Array.isArray(productCollection)) {
      return productCollection;
    }

    if (isRecord(productCollection)) {
      return [productCollection];
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
      console.error("PrestaShop Products API request failed:", {
        status: response.status,
        contentType,
      });

      return NextResponse.json(
        {
          success: false,
          message: "Unable to retrieve products from PrestaShop.",
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

    return NextResponse.json(
      {
        success: true,
        message: "Products retrieved successfully.",
        total: products.length,
        products,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Products API unexpected error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "An unexpected error occurred while retrieving products.",
        products: [],
      },
      { status: 500 }
    );
  }
}