"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Leaf, LockKeyhole } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { safeReturnPath } from "@/utils/safe-redirect";

type AuthPromptRequest = {
  kind: "checkout" | "wishlist";
  returnTo: string;
  productId?: string;
};

interface AuthPromptContextValue {
  showAuthPrompt: (request: AuthPromptRequest) => void;
}

const AuthPromptContext = createContext<AuthPromptContextValue | null>(null);

export function AuthPromptProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [request, setRequest] = useState<AuthPromptRequest | null>(null);

  const showAuthPrompt = useCallback((nextRequest: AuthPromptRequest) => {
    setRequest(nextRequest);
  }, []);

  const signIn = () => {
    if (!request) return;
    const params = new URLSearchParams({
      redirect: safeReturnPath(request.returnTo),
    });
    if (request.kind === "wishlist" && request.productId) {
      params.set("wishlistProductId", request.productId);
    }
    setRequest(null);
    router.push(`/login?${params.toString()}`);
  };

  const value = useMemo(() => ({ showAuthPrompt }), [showAuthPrompt]);

  return (
    <AuthPromptContext.Provider value={value}>
      {children}
      <Dialog open={request !== null} onOpenChange={(open) => !open && setRequest(null)}>
        <DialogContent className="overflow-hidden rounded-3xl border-forest-100 bg-white p-0 shadow-glass sm:max-w-md">
          <div className="bg-gradient-to-br from-forest-900 to-forest-700 px-6 py-7 text-white">
            <span className="flex size-11 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/15">
              {request?.kind === "wishlist" ? (
                <Leaf className="size-5 text-lime-natural" aria-hidden />
              ) : (
                <LockKeyhole className="size-5 text-lime-natural" aria-hidden />
              )}
            </span>
            <DialogHeader className="mt-4 text-left">
              <DialogTitle className="text-xl font-extrabold text-white">
                {request?.kind === "wishlist" ? "Sign in to save this item" : "Sign in to place your order"}
              </DialogTitle>
              <DialogDescription className="mt-2 leading-relaxed text-forest-50/85">
                {request?.kind === "wishlist"
                  ? "Your wishlist is available after signing in. Continue shopping without changing it."
                  : "Signing in is required to place an order. You can continue browsing as a guest, and your basket will stay saved."}
              </DialogDescription>
            </DialogHeader>
          </div>
          <DialogFooter className="flex-col gap-2 p-5 sm:flex-col">
            <Button
              type="button"
              onClick={signIn}
              className="h-12 w-full rounded-xl bg-forest-900 font-bold text-white hover:bg-forest-800"
            >
              Sign In
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setRequest(null)}
              className="h-12 w-full rounded-xl border-forest-200 font-semibold text-charcoal hover:bg-forest-50"
            >
              {request?.kind === "wishlist" ? "Continue Shopping" : "Continue as Guest"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AuthPromptContext.Provider>
  );
}

export function useAuthPrompt(): AuthPromptContextValue {
  const context = useContext(AuthPromptContext);
  if (!context) throw new Error("useAuthPrompt must be used inside <AuthPromptProvider>");
  return context;
}
