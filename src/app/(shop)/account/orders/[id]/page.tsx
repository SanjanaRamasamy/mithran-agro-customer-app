import { ProtectedRoute, ProtectedRedirect } from "@/components/auth/protected-route";

interface AccountOrderPageProps {
  params: Promise<{ id: string }>;
}

export default async function AccountOrderPage({ params }: AccountOrderPageProps) {
  const { id } = await params;
  return (
    <ProtectedRoute>
      <ProtectedRedirect to={`/orders/${encodeURIComponent(id)}`} />
    </ProtectedRoute>
  );
}
