"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { Address, SavedPaymentMethod, User } from "@/types";
import { MOCK_ADDRESSES, MOCK_PAYMENT_METHODS, MOCK_USER } from "@/data/orders";
import { readStorage, writeStorage } from "@/utils/storage";

const AUTH_KEY = "verdant.auth.v1";
const ADDR_KEY = "verdant.addresses.v1";
const PM_KEY = "verdant.payments.v1";

interface AuthContextValue {
  user: User | null;
  addresses: Address[];
  paymentMethods: SavedPaymentMethod[];
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, name?: string) => void;
  loginWithGoogle: () => void;
  logout: () => void;
  updateProfile: (patch: Partial<Pick<User, "name" | "email" | "phone">>) => void;
  addAddress: (address: Omit<Address, "id">) => Address;
  updateAddress: (id: string, patch: Partial<Address>) => void;
  deleteAddress: (id: string) => void;
  setDefaultAddress: (id: string) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [addresses, setAddresses] = useState<Address[]>(MOCK_ADDRESSES);
  const [paymentMethods] = useState<SavedPaymentMethod[]>(MOCK_PAYMENT_METHODS);
  const [isLoading, setIsLoading] = useState(true);

  /* hydrate persisted session */
  useEffect(() => {
    const stored = readStorage<User | null>(AUTH_KEY, null);
    if (stored) setUser(stored);
    const storedAddr = readStorage<Address[] | null>(ADDR_KEY, null);
    if (storedAddr && storedAddr.length) setAddresses(storedAddr);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (!isLoading) writeStorage(AUTH_KEY, user);
  }, [user, isLoading]);

  useEffect(() => {
    if (!isLoading) writeStorage(ADDR_KEY, addresses);
  }, [addresses, isLoading]);

  const login = useCallback((email: string, name?: string) => {
    const base = { ...MOCK_USER };
    const normalizedEmail = email.trim().toLowerCase() || base.email;
    setUser({
      ...base,
      id: normalizedEmail === base.email ? base.id : `demo:${normalizedEmail}`,
      email: normalizedEmail,
      name: name?.trim() ? name.trim() : base.name,
    });
  }, []);

  const loginWithGoogle = useCallback(() => {
    setUser({ ...MOCK_USER, name: "Aarav Sharma (Google)", email: "aarav.sharma@gmail.com" });
  }, []);

  const logout = useCallback(() => setUser(null), []);

  const updateProfile = useCallback((patch: Partial<Pick<User, "name" | "email" | "phone">>) => {
    setUser((u) => (u ? { ...u, ...patch } : u));
  }, []);

  const addAddress = useCallback((address: Omit<Address, "id">) => {
    const created: Address = { ...address, id: `addr-${Date.now()}` };
    setAddresses((prev) => {
      const next = address.isDefault
        ? [...prev.map((a) => ({ ...a, isDefault: false })), created]
        : [...prev, created];
      return next;
    });
    return created;
  }, []);

  const updateAddress = useCallback((id: string, patch: Partial<Address>) => {
    setAddresses((prev) => prev.map((a) => (a.id === id ? { ...a, ...patch } : a)));
  }, []);

  const deleteAddress = useCallback((id: string) => {
    setAddresses((prev) =>
      prev.filter((a) => a.id !== id).map((a, i) => (i === 0 ? { ...a, isDefault: true } : a))
    );
  }, []);

  const setDefaultAddress = useCallback((id: string) => {
    setAddresses((prev) => prev.map((a) => ({ ...a, isDefault: a.id === id })));
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      addresses,
      paymentMethods,
      isAuthenticated: !!user,
      isLoading,
      login,
      loginWithGoogle,
      logout,
      updateProfile,
      addAddress,
      updateAddress,
      deleteAddress,
      setDefaultAddress,
    }),
    [user, addresses, paymentMethods, isLoading, login, loginWithGoogle, logout, updateProfile, addAddress, updateAddress, deleteAddress, setDefaultAddress]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
