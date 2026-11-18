import {
  callAuthenticatedPrestaShopApp,
  customerApiErrorResponse,
  hasSameOrigin,
  readJsonBody,
} from "@/lib/prestashop-app-api";
import { validateAddressFields } from "@/lib/validation";

export async function POST(request: Request) {
  if (!hasSameOrigin(request)) {
    return Response.json({ success: false, message: "Request could not be verified." }, { status: 403 });
  }
  try {
    const body = await readJsonBody(request);
    const check = validateAddressFields(body);
    if (!check.ok) {
      const firstError = Object.values(check.errors)[0] ?? "Check the address details and try again.";
      return Response.json(
        { success: false, code: "invalid_input", message: firstError, errors: check.errors },
        { status: 400, headers: { "Cache-Control": "no-store" } },
      );
    }
    const result = await callAuthenticatedPrestaShopApp(request, "addresses:create", {
      ...body,
      ...check.values,
    });
    return Response.json(result, { status: 201, headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return customerApiErrorResponse(error);
  }
}
