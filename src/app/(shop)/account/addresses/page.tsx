import { ProtectedRoute, ProtectedRedirect } from "@/components/auth/protected-route";

export default function AccountAddressesPage() {
  return (
    <ProtectedRoute>
      <ProtectedRedirect to="/account?tab=addresses" />
    </ProtectedRoute>
  );
}
