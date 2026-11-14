import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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
    const auth = Buffer.from(`${apiKey}:`).toString("base64");

    const url = new URL("/api/categories", baseUrl);
    url.searchParams.set("output_format", "JSON");
    url.searchParams.set("display", "[id,name,link_rewrite]");
    url.searchParams.set("limit", "1");

    const response = await fetch(url.toString(), {
      method: "GET",
      headers: {
        Authorization: `Basic ${auth}`,
        Accept: "application/json",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      return NextResponse.json(
        {
          success: false,
          connected: false,
          message: "PrestaShop API request failed.",
          status: response.status,
          hint:
            response.status === 401
              ? "Check the API key and authentication."
              : response.status === 403
                ? "Check the GET permission for categories."
                : "Check your PrestaShop API configuration.",
        },
        { status: 502 }
      );
    }

    return NextResponse.json({
      success: true,
      connected: true,
      message: "PrestaShop connection successful!",
      store: "Mithran Agro",
    });
  } catch {
    return NextResponse.json(
      {
        success: false,
        connected: false,
        message: "Unable to reach PrestaShop.",
      },
      { status: 502 }
    );
  }
}