import {
  callAuthenticatedPrestaShopApp,
  CustomerApiError,
  customerApiErrorResponse,
  hasSameOrigin,
  readJsonBody,
} from "@/lib/prestashop-app-api";

export async function PATCH(request: Request) {
  if (!hasSameOrigin(request)) {
    return Response.json({ success: false, message: "Request could not be verified." }, { status: 403 });
  }
  try {
    const body = await readJsonBody(request);
    if (
      (body.name !== undefined && typeof body.name !== "string") ||
      (body.phone !== undefined && typeof body.phone !== "string") ||
      body.email !== undefined
    ) {
      throw new CustomerApiError("invalid_input");
    }
    const result = await callAuthenticatedPrestaShopApp(request, "profile:update", {
      name: body.name,
      phone: body.phone,
    });
    return Response.json(result, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return customerApiErrorResponse(error);
  }
}
