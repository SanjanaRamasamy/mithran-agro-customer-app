import {
  callAuthenticatedPrestaShopApp,
  CustomerApiError,
  customerApiErrorResponse,
} from "@/lib/prestashop-app-api";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    if (!/^[1-9]\d{0,9}$/.test(id)) throw new CustomerApiError("order_not_found");
    const result = await callAuthenticatedPrestaShopApp(request, "orders:get", { id });
    return Response.json(result, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    return customerApiErrorResponse(error);
  }
}
