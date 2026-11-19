"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Heart, LockKeyhole } from "lucide-react";
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
        <DialogContent className="overflow-hidden rounded-3xl border border-white/60 bg-white/85 p-6 shadow-lift backdrop-blur-2xl sm:max-w-sm sm:p-7">
          <div className="flex flex-col items-center text-center">
            <span className="flex size-14 items-center justify-center rounded-full border border-forest-200/70 bg-forest-50/90 text-forest-800 shadow-xs backdrop-blur-md">
              {request?.kind === "wishlist" ? (
                <Heart className="size-6 text-forest-700" aria-hidden />
              ) : (
                <LockKeyhole className="size-6 text-forest-700" aria-hidden />
              )}
            </span>
            <DialogHeader className="mt-4 items-center text-center">
              <DialogTitle className="text-xl font-extrabold tracking-tight text-forest-950">
                {request?.kind === "wishlist" ? "Save your favourites" : "Sign in to place your order"}
              </DialogTitle>
              <DialogDescription className="mt-2 max-w-xs text-sm leading-relaxed text-charcoal/75">
                {request?.kind === "wishlist"
                  ? "Sign in to keep your favourite products saved and access them whenever you return."
                  : "Signing in is required to place an order. You can continue browsing as a guest, and your basket will stay saved."}
              </DialogDescription>
            </DialogHeader>
          </div>
          <DialogFooter className="mt-6 flex-col gap-2.5 sm:flex-col">
            <Button
              type="button"
              onClick={signIn}
              className="h-11 w-full rounded-xl bg-forest-900 font-bold text-white shadow-soft transition hover:bg-forest-800"
            >
              Sign In
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setRequest(null)}
              className="h-11 w-full rounded-xl border-forest-200/80 bg-white/70 font-semibold text-charcoal transition hover:bg-forest-50/80"
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
