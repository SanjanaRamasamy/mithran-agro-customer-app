export const CUSTOMER_SESSION_COOKIE = "mithran_customer_session";

const publicErrors: Record<string, { status: number; message: string }> = {
  invalid_input: { status: 400, message: "Check the information and try again." },
  invalid_phone: { status: 400, message: "Enter a valid 10-digit mobile number." },
  invalid_pincode: { status: 400, message: "Enter a valid 6-digit PIN code." },
  invalid_name: { status: 400, message: "Enter both first and last name using letters, spaces, hyphens, or apostrophes." },
  invalid_state: { status: 400, message: "Select a valid Indian state or union territory." },
  invalid_address: { status: 400, message: "Check the address details and try again." },
  invalid_credentials: { status: 401, message: "Email or password is incorrect." },
  duplicate_email: { status: 409, message: "An account with this email already exists." },
  rate_limited: { status: 429, message: "Too many attempts. Please wait and try again." },
  duplicate_submission: { status: 409, message: "This order is already being processed. Check your orders before retrying." },
  unauthorized: { status: 401, message: "Your session has expired. Please sign in again." },
  not_found: { status: 404, message: "The requested customer record was not found." },
  address_not_found: { status: 404, message: "That delivery address could not be found." },
  order_not_found: { status: 404, message: "That order could not be found." },
  stock_changed: { status: 409, message: "Basket availability changed. Review your basket and try again." },
  price_changed: { status: 409, message: "The current total changed. Review the updated total before placing the order." },
  ticket_closed: { status: 409, message: "This support ticket is closed. Open a new ticket for further help." },
  configuration: { status: 503, message: "Customer checkout is not configured yet. Please try again later." },
  unavailable: { status: 503, message: "Customer services are temporarily unavailable. Please try again later." },
};

export class CustomerApiError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(code: string, status?: number) {
    const mapped = publicErrors[code] ?? publicErrors.unavailable;
    super(mapped.message);
    this.name = "CustomerApiError";
    this.code = publicErrors[code] ? code : "unavailable";
    this.status = status ?? mapped.status;
  }
}

export function customerApiErrorDetails(error: unknown): {
  status: number;
  code: string;
  message: string;
} {
  const apiError = error instanceof CustomerApiError
    ? error
    : new CustomerApiError("unavailable");
  return {
    status: apiError.status,
    code: apiError.code,
    message: apiError.message,
  };
}

export function hasSameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return false;
  try {
    return new URL(origin).origin === new URL(request.url).origin;
  } catch {
    return false;
  }
}

export function readCustomerSession(request: Request): string | null {
  const cookieHeader = request.headers.get("cookie");
  if (!cookieHeader) return null;
  for (const part of cookieHeader.split(";")) {
    const separator = part.indexOf("=");
    if (separator < 0 || part.slice(0, separator).trim() !== CUSTOMER_SESSION_COOKIE) continue;
    const value = part.slice(separator + 1).trim();
    return /^[A-Fa-f0-9]{64,128}$/.test(value) ? value : null;
  }
  return null;
}
