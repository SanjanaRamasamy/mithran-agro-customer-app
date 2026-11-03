"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { readStorage, writeStorage } from "@/utils/storage";

const VIEWED_KEY = "verdant.viewed.v1";
const SEARCH_KEY = "verdant.searches.v1";
const MAX_ITEMS = 12;
const MAX_SEARCHES = 8;

interface ActivityContextValue {
  recentlyViewed: string[]; // product ids, most recent first
  trackView: (productId: string) => void;
  clearRecentlyViewed: () => void;
  recentSearches: string[];
  trackSearch: (term: string) => void;
  clearSearchHistory: () => void;
  removeSearch: (term: string) => void;
}

const ActivityContext = createContext<ActivityContextValue | null>(null);

export function ActivityProvider({ children }: { children: React.ReactNode }) {
  const [recentlyViewed, setRecentlyViewed] = useState<string[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setRecentlyViewed(readStorage<string[]>(VIEWED_KEY, []));
    setRecentSearches(readStorage<string[]>(SEARCH_KEY, []));
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) writeStorage(VIEWED_KEY, recentlyViewed);
  }, [recentlyViewed, hydrated]);

  useEffect(() => {
    if (hydrated) writeStorage(SEARCH_KEY, recentSearches);
  }, [recentSearches, hydrated]);

  const trackView = useCallback((productId: string) => {
    setRecentlyViewed((prev) => [productId, ...prev.filter((id) => id !== productId)].slice(0, MAX_ITEMS));
  }, []);

  const clearRecentlyViewed = useCallback(() => setRecentlyViewed([]), []);

  const trackSearch = useCallback((term: string) => {
    const t = term.trim();
    if (!t) return;
    setRecentSearches((prev) => [t, ...prev.filter((s) => s.toLowerCase() !== t.toLowerCase())].slice(0, MAX_SEARCHES));
  }, []);

  const clearSearchHistory = useCallback(() => setRecentSearches([]), []);

  const removeSearch = useCallback((term: string) => {
    setRecentSearches((prev) => prev.filter((s) => s !== term));
  }, []);

  const value = useMemo(
    () => ({
      recentlyViewed,
      trackView,
      clearRecentlyViewed,
      recentSearches,
      trackSearch,
      clearSearchHistory,
      removeSearch,
    }),
    [recentlyViewed, trackView, clearRecentlyViewed, recentSearches, trackSearch, clearSearchHistory, removeSearch]
  );

  return <ActivityContext.Provider value={value}>{children}</ActivityContext.Provider>;
}

export function useActivity(): ActivityContextValue {
  const ctx = useContext(ActivityContext);
  if (!ctx) throw new Error("useActivity must be used inside <ActivityProvider>");
  return ctx;
}
