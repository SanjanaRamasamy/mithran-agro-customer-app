import {
  callAuthenticatedPrestaShopApp,
  CustomerApiError,
  customerApiErrorResponse,
  hasSameOrigin,
  readJsonBody,
} from "@/lib/prestashop-app-api";

type RouteContext = { params: Promise<{ id: string }> };

function validAddressId(id: string): boolean {
  return /^[1-9]\d{0,9}$/.test(id);
}

export async function PATCH(request: Request, context: RouteContext) {
  if (!hasSameOrigin(request)) {
    return Response.json({ success: false, message: "Request could not be verified." }, { status: 403 });
  }
  try {
    const { id } = await context.params;
    if (!validAddressId(id)) throw new CustomerApiError("invalid_input");
    const body = await readJsonBody(request);
    const result = await callAuthenticatedPrestaShopApp(request, "addresses:update", {
      ...body,
      id,
    });
    return Response.json(result, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return customerApiErrorResponse(error);
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  if (!hasSameOrigin(request)) {
    return Response.json({ success: false, message: "Request could not be verified." }, { status: 403 });
  }
  try {
    const { id } = await context.params;
    if (!validAddressId(id)) throw new CustomerApiError("invalid_input");
    const result = await callAuthenticatedPrestaShopApp(request, "addresses:delete", { id });
    return Response.json(result, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return customerApiErrorResponse(error);
  }
}
