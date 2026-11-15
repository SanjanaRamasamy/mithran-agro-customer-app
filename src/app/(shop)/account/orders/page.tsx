import { ProtectedRoute, ProtectedRedirect } from "@/components/auth/protected-route";

export default function AccountOrdersPage() {
  return (
    <ProtectedRoute>
      <ProtectedRedirect to="/orders" />
    </ProtectedRoute>
  );
}
