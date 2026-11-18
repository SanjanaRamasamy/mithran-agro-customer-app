import { callPrestaShopApp } from "@/lib/prestashop-app-api";
import { customerApiErrorDetails } from "@/lib/customer-api-security";
import { parseFarms } from "@/lib/farms";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Public farm directory (no customer session). Data comes only from the
 * `mithranagroapp` module; when the module is not installed or configured the
 * route reports `available: false` so the UI can show an honest state instead
 * of placeholder farms.
 */
export async function GET() {
  try {
    const payload = await callPrestaShopApp<{ farms?: unknown }>("farms:list", {});
    const farms = parseFarms(payload.farms);
    return Response.json(
      { success: true, available: true, farms },
      { headers: { "Cache-Control": "public, max-age=60, stale-while-revalidate=300" } },
    );
  } catch (error) {
    const details = customerApiErrorDetails(error);
    return Response.json(
      {
        success: false,
        available: false,
        code: details.code,
        message:
          details.code === "configuration"
            ? "Farm profiles are not published yet."
            : "Farm profiles are temporarily unavailable.",
        farms: [],
      },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}
