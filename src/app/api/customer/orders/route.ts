import {
  callAuthenticatedPrestaShopApp,
  CustomerApiError,
  customerApiErrorResponse,
  hasSameOrigin,
  readJsonBody,
} from "@/lib/prestashop-app-api";

export async function GET(request: Request) {
  try {
    const result = await callAuthenticatedPrestaShopApp(request, "orders:list");
    return Response.json(result, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    return customerApiErrorResponse(error);
  }
}

export async function POST(request: Request) {
  if (!hasSameOrigin(request)) {
    return Response.json({ success: false, message: "Request could not be verified." }, { status: 403 });
  }
  try {
    const body = await readJsonBody(request);
    if (
      !Array.isArray(body.items) ||
      typeof body.addressId !== "string" ||
      typeof body.idempotencyKey !== "string" ||
      !/^[A-Fa-f0-9-]{36}$/.test(body.idempotencyKey)
    ) {
      throw new CustomerApiError("invalid_input");
    }
    const result = await callAuthenticatedPrestaShopApp(request, "checkout:create", body);
    return Response.json(result, { status: 201, headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    return customerApiErrorResponse(error);
  }
}
