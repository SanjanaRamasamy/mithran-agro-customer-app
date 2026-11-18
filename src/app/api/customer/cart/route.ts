import {
  callAuthenticatedPrestaShopApp,
  CustomerApiError,
  customerApiErrorResponse,
  hasSameOrigin,
  readJsonBody,
} from "@/lib/prestashop-app-api";

export async function GET(request: Request) {
  try {
    const result = await callAuthenticatedPrestaShopApp(request, "cart:get");
    return Response.json(result, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    return customerApiErrorResponse(error);
  }
}

export async function PUT(request: Request) {
  if (!hasSameOrigin(request)) {
    return Response.json({ success: false, message: "Request could not be verified." }, { status: 403 });
  }
  try {
    const body = await readJsonBody(request);
    if (!Array.isArray(body.items)) throw new CustomerApiError("invalid_input");
    const result = await callAuthenticatedPrestaShopApp(request, "cart:save", { items: body.items });
    return Response.json(result, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    return customerApiErrorResponse(error);
  }
}
