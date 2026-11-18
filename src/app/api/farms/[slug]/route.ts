import { callPrestaShopApp } from "@/lib/prestashop-app-api";
import { customerApiErrorDetails } from "@/lib/customer-api-security";
import { isFarmSlug, parseFarm } from "@/lib/farms";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!isFarmSlug(slug)) {
    return Response.json({ success: false, code: "not_found", message: "Farm not found." }, { status: 404 });
  }
  try {
    const payload = await callPrestaShopApp<{ farm?: unknown }>("farms:get", { slug });
    const farm = parseFarm(payload.farm);
    if (!farm) {
      return Response.json({ success: false, code: "not_found", message: "Farm not found." }, { status: 404 });
    }
    return Response.json(
      { success: true, farm },
      { headers: { "Cache-Control": "public, max-age=60, stale-while-revalidate=300" } },
    );
  } catch (error) {
    const details = customerApiErrorDetails(error);
    if (details.code === "not_found") {
      return Response.json({ success: false, code: "not_found", message: "Farm not found." }, { status: 404 });
    }
    return Response.json(
      { success: false, code: details.code, message: "Farm profiles are temporarily unavailable." },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}
