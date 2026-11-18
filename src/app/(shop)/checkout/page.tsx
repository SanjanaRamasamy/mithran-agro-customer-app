import { CheckoutForm } from "@/components/checkout/checkout-form";
import { ProtectedRoute } from "@/components/auth/protected-route";

export default function CheckoutPage() {
  return (
    <ProtectedRoute>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <h1 className="text-2xl font-extrabold tracking-tight text-charcoal sm:text-3xl">Checkout</h1>
        <p className="mb-6 mt-1 text-sm text-graymute">
          Choose a saved PrestaShop delivery address, review the current store total, and place a Cash on Delivery order.
        </p>
        <CheckoutForm />
      </div>
    </ProtectedRoute>
  );
}
