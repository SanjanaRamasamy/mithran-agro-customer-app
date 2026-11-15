import { ProtectedRoute, ProtectedRedirect } from "@/components/auth/protected-route";

export default function AccountWishlistPage() {
  return (
    <ProtectedRoute>
      <ProtectedRedirect to="/wishlist" />
    </ProtectedRoute>
  );
}
