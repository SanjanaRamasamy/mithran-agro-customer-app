import { NextResponse } from "next/server";

export const runtime = "nodejs";

interface RouteContext {
  params: Promise<{ productId: string; imageId: string }>;
}

export async function GET(_request: Request, { params }: RouteContext) {
  const { productId, imageId } = await params;
  if (!/^\d+$/.test(productId) || !/^\d+$/.test(imageId)) {
    return NextResponse.json({ success: false }, { status: 400 });
  }

  const baseUrl = process.env.PRESTASHOP_BASE_URL?.trim();
  const apiKey = process.env.PRESTASHOP_API_KEY?.trim();
  if (!baseUrl || !apiKey) {
    return NextResponse.json({ success: false }, { status: 503 });
  }

  try {
    const normalizedBaseUrl = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
    const imageUrl = new URL(
      `api/images/products/${productId}/${imageId}`,
      normalizedBaseUrl
    );
    const authorization = Buffer.from(`${apiKey}:`).toString("base64");
    const response = await fetch(imageUrl, {
      headers: { Authorization: `Basic ${authorization}`, Accept: "image/*" },
      cache: "no-store",
    });

    if (!response.ok || !response.body) {
      return new NextResponse(null, { status: response.status || 404 });
    }

    const contentType = response.headers.get("content-type") ?? "";
    if (!/^image\/(jpeg|png|webp|gif|avif)$/i.test(contentType)) {
      return new NextResponse(null, { status: 502 });
    }

    return new Response(response.body, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=300, stale-while-revalidate=3600",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return new NextResponse(null, { status: 502 });
  }
}