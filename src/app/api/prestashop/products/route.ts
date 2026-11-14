import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  const baseUrl = process.env.PRESTASHOP_BASE_URL;
  const apiKey = process.env.PRESTASHOP_API_KEY;

  if (!baseUrl || !apiKey) {
    return NextResponse.json(
      {
        success: false,
        message: "PrestaShop environment variables are missing.",
        products: [],
      },
      { status: 500 }
    );
  }

  try {
    const credentials = Buffer.from(`${apiKey}:`).toString("base64");

    const endpoint = new URL(
      "/api/products",
      baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`
    );

    endpoint.searchParams.set("output_format", "JSON");
    endpoint.searchParams.set("display", "full");

    const response = await fetch(endpoint.toString(), {
      method: "GET",
      headers: {
        Authorization: `Basic ${credentials}`,
        Accept: "application/json",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      return NextResponse.json(
        {
          success: false,
          message: "Unable to fetch products from PrestaShop.",
          status: response.status,
          products: [],
        },
        { status: response.status }
      );
    }

    const data: unknown = await response.json();

    if (
      typeof data !== "object" ||
      data === null ||
      !("products" in data) ||
      !Array.isArray(data.products)
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Unexpected response format from PrestaShop.",
          products: [],
        },
        { status: 502 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Products fetched successfully.",
      products: data.products,
    });
  } catch {
    return NextResponse.json(
      {
        success: false,
        message: "An error occurred while connecting to PrestaShop.",
        products: [],
      },
      { status: 500 }
    );
  }
}