import { NextResponse } from "next/server";
import {
  callPrestaShopApp,
  customerApiErrorResponse,
  readCustomerSession,
  clearCustomerSessionCookie,
  hasSameOrigin,
} from "@/lib/prestashop-app-api";

interface SessionResult {
  success: true;
  user: unknown;
  addresses: unknown[];
}

export async function GET(request: Request) {
  const token = readCustomerSession(request);
  if (!token) {
    return Response.json(
      { success: true, authenticated: false, user: null, addresses: [] },
      { headers: { "Cache-Control": "no-store" } },
    );
  }
  try {
    const result = await callPrestaShopApp<SessionResult>("session", {}, token);
    return Response.json(
      { success: true, authenticated: true, user: result.user, addresses: result.addresses },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    const response = customerApiErrorResponse(error);
    if (response.status === 401) {
      const cleared = NextResponse.json(
        { success: true, authenticated: false, user: null, addresses: [] },
        { headers: { "Cache-Control": "no-store" } },
      );
      clearCustomerSessionCookie(cleared);
      return cleared;
    }
    return response;
  }
}

export async function DELETE(request: Request) {
  if (!hasSameOrigin(request)) {
    return Response.json({ success: false, message: "Request could not be verified." }, { status: 403 });
  }
  const token = readCustomerSession(request);
  if (!token) return Response.json({ success: true });

  try {
    await callPrestaShopApp("logout", {}, token);
    const response = NextResponse.json({ success: true }, { headers: { "Cache-Control": "no-store" } });
    clearCustomerSessionCookie(response);
    return response;
  } catch (error) {
    const response = customerApiErrorResponse(error);
    const cleared = NextResponse.json(
      { success: false, message: "Could not confirm sign out. Please try again." },
      { status: response.status, headers: { "Cache-Control": "no-store" } },
    );
    clearCustomerSessionCookie(cleared);
    return cleared;
  }
}
