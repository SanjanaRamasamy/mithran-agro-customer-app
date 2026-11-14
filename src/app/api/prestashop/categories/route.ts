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
      },
      { status: 500 }
    );
  }

  try {
    const credentials = Buffer.from(`${apiKey}:`).toString("base64");

    const response = await fetch(
      `${baseUrl}/api/categories?output_format=JSON&display=full`,
      {
        headers: {
          Authorization: `Basic ${credentials}`,
          Accept: "application/json",
        },
        cache: "no-store",
      }
    );

    if (!response.ok) {
      return NextResponse.json(
        {
          success: false,
          message: "Unable to fetch categories from PrestaShop.",
          status: response.status,
        },
        { status: response.status }
      );
    }

    const data = await response.json();

    return NextResponse.json({
      success: true,
      message: "Categories fetched successfully.",
      categories: data.categories ?? [],
    });
  } catch {
    return NextResponse.json(
      {
        success: false,
        message: "An error occurred while connecting to PrestaShop.",
      },
      { status: 500 }
    );
  }
}