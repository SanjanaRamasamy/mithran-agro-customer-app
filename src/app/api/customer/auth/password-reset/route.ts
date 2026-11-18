import {
  callPrestaShopApp,
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
    if (typeof body.email !== "string") throw new CustomerApiError("invalid_input");
    await callPrestaShopApp("password:request-reset", { email: body.email });
    return Response.json(
      {
        success: true,
        message: "If an active account uses that email, PrestaShop will send its password reset link.",
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return customerApiErrorResponse(error);
  }
}
