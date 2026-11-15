"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { safeReturnPath } from "@/utils/safe-redirect";

function RouteLoading() {
  return (
    <div
      className="mx-auto min-h-[45vh] max-w-4xl px-4 py-12"
      role="status"
      aria-live="polite"
      aria-label="Checking your sign-in"
    >
      <div className="shimmer h-28 rounded-2xl" />
      <span className="sr-only">Checking your sign-in…</span>
    </div>
  );
}

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (isLoading || isAuthenticated) return;

    const requestedPath = `${window.location.pathname}${window.location.search}${window.location.hash}`;
    const returnPath = safeReturnPath(requestedPath);
    router.replace(`/login?redirect=${encodeURIComponent(returnPath)}`);
  }, [isAuthenticated, isLoading, router]);

  if (isLoading || !isAuthenticated) return <RouteLoading />;
  return children;
}

export function ProtectedRedirect({ to }: { to: string }) {
  const router = useRouter();

  useEffect(() => {
    router.replace(to);
  }, [router, to]);

  return <RouteLoading />;
}
