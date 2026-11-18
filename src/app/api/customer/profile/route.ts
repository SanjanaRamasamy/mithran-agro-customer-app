import {
  callAuthenticatedPrestaShopApp,
  CustomerApiError,
  customerApiErrorResponse,
  hasSameOrigin,
  readJsonBody,
} from "@/lib/prestashop-app-api";
import { validateIndianMobile, validatePersonName } from "@/lib/validation";

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
    const errors: Record<string, string> = {};
    let validatedName: string | undefined;
    let validatedPhone: string | undefined;

    if (body.name !== undefined) {
      const nameCheck = validatePersonName(body.name, { min: 2, max: 80, requireFullName: true, label: "Full name" });
      if (!nameCheck.ok && nameCheck.error) errors.name = nameCheck.error;
      validatedName = nameCheck.value;
    }
    if (body.phone !== undefined) {
      const phoneCheck = validateIndianMobile(body.phone);
      if (!phoneCheck.ok && phoneCheck.error) errors.phone = phoneCheck.error;
      validatedPhone = phoneCheck.value;
    }
    if (Object.keys(errors).length > 0) {
      const firstError = Object.values(errors)[0] ?? "Check your profile details and try again.";
      return Response.json(
        { success: false, code: "invalid_input", message: firstError, errors },
        { status: 400, headers: { "Cache-Control": "no-store" } },
      );
    }

    const result = await callAuthenticatedPrestaShopApp(request, "profile:update", {
      name: validatedName,
      phone: validatedPhone,
    });
    return Response.json(result, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return customerApiErrorResponse(error);
  }
}
