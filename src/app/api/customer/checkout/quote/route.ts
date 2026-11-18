import {
  callAuthenticatedPrestaShopApp,
  CustomerApiError,
  customerApiErrorResponse,
  hasSameOrigin,
  readJsonBody,
} from "@/lib/prestashop-app-api";

export async function POST(request: Request) {
  if (!hasSameOrigin(request)) {
    return Response.json({ success: false, message: "Request could not be verified." }, { status: 403 });
  }
  try {
    const body = await readJsonBody(request);
    if (!Array.isArray(body.items) || typeof body.addressId !== "string") {
      throw new CustomerApiError("invalid_input");
    }
    const result = await callAuthenticatedPrestaShopApp(request, "checkout:quote", body);
    return Response.json(result, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    return customerApiErrorResponse(error);
  }
}
