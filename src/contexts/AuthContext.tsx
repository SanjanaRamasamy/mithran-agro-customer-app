"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { Address, SavedPaymentMethod, User } from "@/types";

interface AuthContextValue {
  user: User | null;
  addresses: Address[];
  paymentMethods: SavedPaymentMethod[];
  isAuthenticated: boolean;
  isLoading: boolean;
  authError: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (patch: Partial<Pick<User, "name" | "phone">>) => Promise<void>;
  addAddress: (address: Omit<Address, "id">) => Promise<Address>;
  updateAddress: (id: string, patch: Partial<Address>) => Promise<void>;
  deleteAddress: (id: string) => Promise<void>;
  setDefaultAddress: (id: string) => Promise<void>;
}

interface CustomerPayload {
  success: boolean;
  authenticated?: boolean;
  user?: unknown;
  addresses?: unknown;
  address?: unknown;
  message?: string;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function mapUser(value: unknown): User | null {
  if (typeof value !== "object" || value === null) return null;
  const record = value as Record<string, unknown>;
  if (
    typeof record.id !== "string" ||
    typeof record.name !== "string" ||
    typeof record.email !== "string"
  ) return null;
  return {
    id: record.id,
    name: record.name,
    email: record.email,
    phone: typeof record.phone === "string" ? record.phone : "",
    avatar: typeof record.avatar === "string" ? record.avatar : "",
    memberSince: typeof record.memberSince === "string" ? record.memberSince : "",
    loyaltyPoints: typeof record.loyaltyPoints === "number" ? record.loyaltyPoints : 0,
    tier: record.tier === "grower" || record.tier === "harvest" ? record.tier : "sprout",
  };
}

function mapAddress(value: unknown): Address | null {
  if (typeof value !== "object" || value === null) return null;
  const record = value as Record<string, unknown>;
  if (
    typeof record.id !== "string" ||
    typeof record.name !== "string" ||
    typeof record.line1 !== "string" ||
    typeof record.city !== "string" ||
    typeof record.state !== "string" ||
    typeof record.pincode !== "string"
  ) return null;
  const type = record.type === "work" || record.type === "other" ? record.type : "home";
  return {
    id: record.id,
    label: typeof record.label === "string" ? record.label : "Address",
    name: record.name,
    phone: typeof record.phone === "string" ? record.phone : "",
    line1: record.line1,
    line2: typeof record.line2 === "string" ? record.line2 : undefined,
    city: record.city,
    state: record.state,
    pincode: record.pincode,
    type,
    isDefault: record.isDefault === true,
    deliveryInstructions: typeof record.deliveryInstructions === "string"
      ? record.deliveryInstructions
      : undefined,
  };
}

function customerPayload(value: unknown): CustomerPayload {
  if (typeof value !== "object" || value === null) {
    throw new Error("Customer service returned an invalid response.");
  }
  return value as CustomerPayload;
}

async function requestCustomerApi(
  url: string,
  init?: RequestInit,
): Promise<CustomerPayload> {
  let response: Response;
  try {
    response = await fetch(url, {
      ...init,
      cache: "no-store",
      headers: {
        "Content-Type": "application/json",
        ...init?.headers,
      },
    });
  } catch {
    throw new Error("Customer service is unavailable. Please try again later.");
  }
  let payload: CustomerPayload;
  try {
    payload = customerPayload(await response.json());
  } catch {
    throw new Error("Customer service returned an invalid response.");
  }
  if (!response.ok || payload.success !== true) {
    throw new Error(payload.message || "Customer request could not be completed.");
  }
  return payload;
}

function mappedAddresses(value: unknown): Address[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((entry) => {
    const address = mapAddress(entry);
    return address ? [address] : [];
  });
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    void requestCustomerApi("/api/customer/auth/session", { signal: controller.signal })
      .then((payload) => {
        const nextUser = payload.authenticated ? mapUser(payload.user) : null;
        if (payload.authenticated && !nextUser) {
          throw new Error("Customer service returned an invalid profile.");
        }
        setUser(nextUser);
        setAddresses(nextUser ? mappedAddresses(payload.addresses) : []);
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        setUser(null);
        setAddresses([]);
        setAuthError(error instanceof Error ? error.message : "Unable to check your sign-in.");
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false);
      });
    return () => controller.abort();
  }, []);

  const acceptAuthentication = useCallback(async (url: string, body: Record<string, string>) => {
    setAuthError(null);
    const payload = await requestCustomerApi(url, {
      method: "POST",
      body: JSON.stringify(body),
    });
    const nextUser = mapUser(payload.user);
    if (!nextUser) throw new Error("Customer service returned an invalid profile.");
    setUser(nextUser);
    setAddresses(mappedAddresses(payload.addresses));
    return nextUser;
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    await acceptAuthentication("/api/customer/auth/login", { email, password });
  }, [acceptAuthentication]);

  const register = useCallback(async (name: string, email: string, password: string) => {
    await acceptAuthentication("/api/customer/auth/register", { name, email, password });
  }, [acceptAuthentication]);

  const logout = useCallback(async () => {
    setAuthError(null);
    try {
      await requestCustomerApi("/api/customer/auth/session", { method: "DELETE" });
    } finally {
      setUser(null);
      setAddresses([]);
    }
  }, []);

  const updateProfile = useCallback(async (patch: Partial<Pick<User, "name" | "phone">>) => {
    const payload = await requestCustomerApi("/api/customer/profile", {
      method: "PATCH",
      body: JSON.stringify(patch),
    });
    const nextUser = mapUser(payload.user);
    if (!nextUser) throw new Error("Customer service returned an invalid profile.");
    setUser(nextUser);
  }, []);

  const addAddress = useCallback(async (address: Omit<Address, "id">) => {
    const payload = await requestCustomerApi("/api/customer/addresses", {
      method: "POST",
      body: JSON.stringify(address),
    });
    const created = mapAddress(payload.address);
    if (!created) throw new Error("Customer service returned an invalid address.");
    setAddresses((previous) => [
      ...previous.map((item) => item.isDefault && created.isDefault ? { ...item, isDefault: false } : item),
      created,
    ]);
    return created;
  }, []);

  const updateAddress = useCallback(async (id: string, patch: Partial<Address>) => {
    const payload = await requestCustomerApi(`/api/customer/addresses/${encodeURIComponent(id)}`, {
      method: "PATCH",
      body: JSON.stringify(patch),
    });
    const updated = mapAddress(payload.address);
    if (!updated) throw new Error("Customer service returned an invalid address.");
    setAddresses((previous) => previous.map((item) => item.id === id ? updated : item));
  }, []);

  const deleteAddress = useCallback(async (id: string) => {
    await requestCustomerApi(`/api/customer/addresses/${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
    setAddresses((previous) => previous.filter((item) => item.id !== id));
  }, []);

  const setDefaultAddress = useCallback(async (id: string) => {
    const payload = await requestCustomerApi(`/api/customer/addresses/${encodeURIComponent(id)}`, {
      method: "PATCH",
      body: JSON.stringify({ isDefault: true }),
    });
    const updated = mapAddress(payload.address);
    if (!updated) throw new Error("Customer service returned an invalid address.");
    setAddresses((previous) => previous.map((item) => item.id === id
      ? updated
      : { ...item, isDefault: false }));
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      addresses,
      paymentMethods: [],
      isAuthenticated: !!user,
      isLoading,
      authError,
      login,
      register,
      logout,
      updateProfile,
      addAddress,
      updateAddress,
      deleteAddress,
      setDefaultAddress,
    }),
    [
      user, addresses, isLoading, authError, login, register, logout,
      updateProfile, addAddress, updateAddress, deleteAddress, setDefaultAddress,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
