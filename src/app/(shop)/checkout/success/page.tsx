import { redirect } from "next/navigation";

export default async function CheckoutSuccessRedirect({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const { id } = await searchParams;
  redirect(id ? `/order-confirmation?id=${encodeURIComponent(id)}` : "/order-confirmation");
}
