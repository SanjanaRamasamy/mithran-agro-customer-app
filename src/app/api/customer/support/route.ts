import {
  callAuthenticatedPrestaShopApp,
  CustomerApiError,
  customerApiErrorResponse,
  hasSameOrigin,
  readJsonBody,
} from "@/lib/prestashop-app-api";

export async function GET(request: Request) {
  try {
    const result = await callAuthenticatedPrestaShopApp(request, "support:list");
    return Response.json(result, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    return customerApiErrorResponse(error);
  }
}

export async function POST(request: Request) {
  if (!hasSameOrigin(request)) {
    return Response.json({ success: false, message: "Request could not be verified." }, { status: 403 });
  }
  try {
    const body = await readJsonBody(request);
    if (typeof body.subject !== "string" || typeof body.message !== "string") {
      throw new CustomerApiError("invalid_input");
    }
    const result = await callAuthenticatedPrestaShopApp(request, "support:create", body);
    return Response.json(result, { status: 201, headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    return customerApiErrorResponse(error);
  }
}

/** Reply to one of the signed-in customer's own tickets. */
export async function PATCH(request: Request) {
  if (!hasSameOrigin(request)) {
    return Response.json({ success: false, message: "Request could not be verified." }, { status: 403 });
  }
  try {
    const body = await readJsonBody(request);
    if (
      typeof body.ticketId !== "string" ||
      !/^[a-f0-9]{32}$/.test(body.ticketId) ||
      typeof body.message !== "string" ||
      body.message.trim().length < 2 ||
      body.message.length > 4000
    ) {
      throw new CustomerApiError("invalid_input");
    }
    const result = await callAuthenticatedPrestaShopApp(request, "support:reply", {
      ticketId: body.ticketId,
      message: body.message,
    });
    return Response.json(result, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    return customerApiErrorResponse(error);
  }
}
