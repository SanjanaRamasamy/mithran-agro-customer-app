import { CheckoutForm } from "@/components/checkout/checkout-form";

export default function CheckoutPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <h1 className="text-2xl font-extrabold tracking-tight text-charcoal sm:text-3xl">Checkout</h1>
      <p className="mb-6 mt-1 text-sm text-graymute">
        Four quick steps — receiver, address, slot, payment. Everything below is simulated.
      </p>
      <CheckoutForm />
    </div>
  );
}
