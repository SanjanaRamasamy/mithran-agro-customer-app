import { ProtectedRoute } from "@/components/auth/protected-route";
import { EmptyAccountSection } from "@/components/account/empty-account-section";

export default function AccountSupportPage() {
  return (
    <ProtectedRoute>
      <EmptyAccountSection
        title="Support"
        description="There is no authenticated support-ticket service in this demo. You can use the public contact page; private order support requires a server-side customer session."
        actionLabel="Contact Mithran Agro"
        actionHref="/contact"
      />
    </ProtectedRoute>
  );
}
