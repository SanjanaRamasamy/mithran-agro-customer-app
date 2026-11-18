import { NextResponse } from "next/server";
import {
  CUSTOMER_SESSION_COOKIE,
  CustomerApiError,
  customerApiErrorDetails,
  hasSameOrigin,
  readCustomerSession,
} from "@/lib/customer-api-security";

export {
  CUSTOMER_SESSION_COOKIE,
  CustomerApiError,
  hasSameOrigin,
  readCustomerSession,
} from "@/lib/customer-api-security";

const CUSTOMER_SESSION_MAX_AGE = 60 * 60 * 24 * 14;

export function customerApiErrorResponse(error: unknown): Response {
  const details = customerApiErrorDetails(error);
  return Response.json(
    { success: false, code: details.code, message: details.message },
    { status: details.status, headers: { "Cache-Control": "no-store" } },
  );
}

export async function readJsonBody(request: Request): Promise<Record<string, unknown>> {
  let value: unknown;
  try {
    value = await request.json();
  } catch {
    throw new CustomerApiError("invalid_input");
  }
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new CustomerApiError("invalid_input");
  }
  return value as Record<string, unknown>;
}

export function setCustomerSessionCookie(response: NextResponse, token: string): void {
  response.cookies.set(CUSTOMER_SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: CUSTOMER_SESSION_MAX_AGE,
  });
}

export function clearCustomerSessionCookie(response: NextResponse): void {
  response.cookies.set(CUSTOMER_SESSION_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

export async function callPrestaShopApp<T>(
  action: string,
  body: Record<string, unknown>,
  sessionToken?: string,
): Promise<T> {
  const baseUrl = process.env.PRESTASHOP_BASE_URL?.trim();
  const sharedSecret = process.env.PRESTASHOP_APP_MODULE_SECRET?.trim();
  if (!baseUrl || !sharedSecret || sharedSecret.length < 32) {
    throw new CustomerApiError("configuration");
  }

  let endpoint: URL;
  try {
    const base = new URL(baseUrl);
    if (base.username || base.password) throw new Error("Credentials are not allowed in the store URL.");
    if (!base.pathname.endsWith("/")) base.pathname += "/";
    endpoint = new URL("index.php", base);
  } catch {
    throw new CustomerApiError("configuration");
  }
  if (
    endpoint.protocol !== "https:" &&
    process.env.NODE_ENV !== "development"
  ) {
    throw new CustomerApiError("configuration");
  }
  endpoint.searchParams.set("fc", "module");
  endpoint.searchParams.set("module", "mithranagroapp");
  endpoint.searchParams.set("controller", "api");
  endpoint.searchParams.set("action", action);

  let response: Response;
  try {
    response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Mithran-Integration-Key": sharedSecret,
        ...(sessionToken ? { Authorization: `Bearer ${sessionToken}` } : {}),
      },
      body: JSON.stringify(body),
      cache: "no-store",
      redirect: "error",
      signal: AbortSignal.timeout(15_000),
    });
  } catch {
    throw new CustomerApiError("unavailable");
  }

  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    throw new CustomerApiError("unavailable");
  }

  if (!response.ok) {
    const code =
      typeof payload === "object" &&
      payload !== null &&
      "code" in payload &&
      typeof payload.code === "string"
        ? payload.code
        : "unavailable";
    throw new CustomerApiError(code);
  }
  return payload as T;
}

export async function callAuthenticatedPrestaShopApp<T>(
  request: Request,
  action: string,
  body: Record<string, unknown> = {},
): Promise<T> {
  const token = readCustomerSession(request);
  if (!token) throw new CustomerApiError("unauthorized");
  return callPrestaShopApp<T>(action, body, token);
}
