import {
  callAuthenticatedPrestaShopApp,
  CustomerApiError,
  customerApiErrorResponse,
  hasSameOrigin,
  readJsonBody,
} from "@/lib/prestashop-app-api";
import { validateAddressFields } from "@/lib/validation";

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
    const isDefaultOnly =
      Object.keys(body).length === 1 && typeof body.isDefault === "boolean";
    let validatedPatch: Record<string, unknown> = body;
    if (!isDefaultOnly) {
      const check = validateAddressFields(body);
      if (!check.ok) {
        const firstError = Object.values(check.errors)[0] ?? "Check the address details and try again.";
        return Response.json(
          { success: false, code: "invalid_input", message: firstError, errors: check.errors },
          { status: 400, headers: { "Cache-Control": "no-store" } },
        );
      }
      validatedPatch = { ...body, ...check.values };
    }
    const result = await callAuthenticatedPrestaShopApp(request, "addresses:update", {
      ...validatedPatch,
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
