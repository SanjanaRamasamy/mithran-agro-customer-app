"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo } from "react";
import { writeStorage } from "@/utils/storage";

type Theme = "light";

interface ThemeContextValue {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (t: "light" | "dark") => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);
const THEME_KEY = "verdant.theme.v1";

/** Customer App uses light mode only; always clears any legacy `.dark` class. */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    document.documentElement.classList.remove("dark");
    writeStorage(THEME_KEY, "light");
  }, []);

  const setTheme = useCallback(() => {
    document.documentElement.classList.remove("dark");
    writeStorage(THEME_KEY, "light");
  }, []);

  const toggleTheme = useCallback(() => {
    document.documentElement.classList.remove("dark");
    writeStorage(THEME_KEY, "light");
  }, []);

  const value = useMemo<ThemeContextValue>(
    () => ({ theme: "light", toggleTheme, setTheme }),
    [toggleTheme, setTheme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used inside <ThemeProvider>");
  return ctx;
}
