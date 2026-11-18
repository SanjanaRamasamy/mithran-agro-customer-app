import { NextResponse } from "next/server";
import {
  callPrestaShopApp,
  CustomerApiError,
  customerApiErrorResponse,
  hasSameOrigin,
  readJsonBody,
  setCustomerSessionCookie,
} from "@/lib/prestashop-app-api";
import { validateEmail, validatePassword, validatePersonName } from "@/lib/validation";

interface RegistrationResult {
  success: true;
  token: string;
  user: unknown;
  addresses: unknown[];
}

export async function POST(request: Request) {
  if (!hasSameOrigin(request)) {
    return Response.json({ success: false, message: "Request could not be verified." }, { status: 403 });
  }
  try {
    const body = await readJsonBody(request);
    if (
      typeof body.name !== "string" ||
      typeof body.email !== "string" ||
      typeof body.password !== "string"
    ) {
      throw new CustomerApiError("invalid_input");
    }
    const nameCheck = validatePersonName(body.name, { min: 2, max: 80, requireFullName: true, label: "Full name" });
    const emailCheck = validateEmail(body.email);
    const passwordCheck = validatePassword(body.password);
    const errors: Record<string, string> = {};
    if (!nameCheck.ok && nameCheck.error) errors.name = nameCheck.error;
    if (!emailCheck.ok && emailCheck.error) errors.email = emailCheck.error;
    if (!passwordCheck.ok && passwordCheck.error) errors.password = passwordCheck.error;
    if (Object.keys(errors).length > 0) {
      const firstError = Object.values(errors)[0] ?? "Check the information and try again.";
      return Response.json(
        { success: false, code: "invalid_input", message: firstError, errors },
        { status: 400, headers: { "Cache-Control": "no-store" } },
      );
    }
    const result = await callPrestaShopApp<RegistrationResult>("register", {
      name: nameCheck.value,
      email: emailCheck.value,
      password: passwordCheck.value,
    });
    if (!result.success || !/^[A-Fa-f0-9]{64,128}$/.test(result.token)) {
      throw new CustomerApiError("unavailable");
    }
    const response = NextResponse.json(
      { success: true, user: result.user, addresses: result.addresses },
      { status: 201, headers: { "Cache-Control": "no-store" } },
    );
    setCustomerSessionCookie(response, result.token);
    return response;
  } catch (error) {
    return customerApiErrorResponse(error);
  }
}
