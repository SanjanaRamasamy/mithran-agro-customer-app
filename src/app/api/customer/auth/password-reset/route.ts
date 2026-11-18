import {
  callPrestaShopApp,
  CustomerApiError,
  customerApiErrorResponse,
  hasSameOrigin,
  readJsonBody,
} from "@/lib/prestashop-app-api";
import { validateEmail } from "@/lib/validation";

export async function POST(request: Request) {
  if (!hasSameOrigin(request)) {
    return Response.json({ success: false, message: "Request could not be verified." }, { status: 403 });
  }
  try {
    const body = await readJsonBody(request);
    if (typeof body.email !== "string") throw new CustomerApiError("invalid_input");
    const emailCheck = validateEmail(body.email);
    if (!emailCheck.ok) {
      return Response.json(
        { success: false, code: "invalid_input", message: emailCheck.error },
        { status: 400, headers: { "Cache-Control": "no-store" } },
      );
    }
    await callPrestaShopApp("password:request-reset", { email: emailCheck.value });
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
