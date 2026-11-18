import { NextResponse } from "next/server";
import {
  callPrestaShopApp,
  CustomerApiError,
  customerApiErrorResponse,
  hasSameOrigin,
  readJsonBody,
  setCustomerSessionCookie,
} from "@/lib/prestashop-app-api";
import { validateEmail } from "@/lib/validation";

interface LoginResult {
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
    if (typeof body.email !== "string" || typeof body.password !== "string") {
      throw new CustomerApiError("invalid_input");
    }
    const emailCheck = validateEmail(body.email);
    if (!emailCheck.ok || body.password.length === 0 || body.password.length > 4096) {
      throw new CustomerApiError("invalid_input");
    }
    const result = await callPrestaShopApp<LoginResult>("login", {
      email: emailCheck.value,
      password: body.password,
    });
    if (!result.success || !/^[A-Fa-f0-9]{64,128}$/.test(result.token)) {
      throw new CustomerApiError("unavailable");
    }
    const response = NextResponse.json(
      { success: true, user: result.user, addresses: result.addresses },
      { headers: { "Cache-Control": "no-store" } },
    );
    setCustomerSessionCookie(response, result.token);
    return response;
  } catch (error) {
    return customerApiErrorResponse(error);
  }
}
