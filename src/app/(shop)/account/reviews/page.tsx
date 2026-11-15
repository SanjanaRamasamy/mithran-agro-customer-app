import { ProtectedRoute } from "@/components/auth/protected-route";
import { EmptyAccountSection } from "@/components/account/empty-account-section";

export default function AccountReviewsPage() {
  return (
    <ProtectedRoute>
      <EmptyAccountSection
        title="My reviews"
        description="Review submission and review history are not connected to a customer backend in this demo."
        actionLabel="Browse products"
        actionHref="/search"
      />
    </ProtectedRoute>
  );
}
