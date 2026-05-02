"use client";

/**
 * ThemeProvider — Custom lightweight theme provider.
 *
 * WHY NOT next-themes?
 * next-themes v0.4.x injects a <script> tag for FOUC prevention.
 * React 19 flags this as an error: "Encountered a script tag while
 * rendering React component. Scripts inside React components are never
 * executed when rendering on the client."
 *
 * This custom provider achieves the same functionality (dark/light/system
 * theme switching with localStorage persistence) WITHOUT injecting any
 * script tags, making it fully compatible with React 19.
 *
 * The theme class is applied to <html> via a useEffect, and the
 * suppressHydrationWarning on <html> handles the class mismatch.
 *
 * IMPORTANT: This provider must be the ONLY theme provider in the app.
 * Do NOT import from "next-themes" anywhere — use useTheme() from this
 * module instead. The sonner.tsx component was also patched to use
 * this custom provider instead of next-themes.
 */
import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";

type Theme = "light" | "dark" | "system";

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  resolvedTheme: "light" | "dark";
}

const ThemeContext = createContext<ThemeContextType | null>(null);

const STORAGE_KEY = "tasksphere-theme";

function getSystemTheme(): "light" | "dark" {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function applyTheme(theme: Theme) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  const resolved = theme === "system" ? getSystemTheme() : theme;

  root.classList.remove("light", "dark");
  root.classList.add(resolved);

  // Also set the color-scheme CSS property for native form controls
  root.style.colorScheme = resolved;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("system");
  const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">("light");
  const [mounted, setMounted] = useState(false);

  const initializedRef = useRef(false);

  // ── Load theme from localStorage after mount ──
  // Uses queueMicrotask to satisfy react-hooks/set-state-in-effect rule
  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    const stored = localStorage.getItem(STORAGE_KEY) as Theme | null;
    const initial = stored || "system";
    const resolved = initial === "system" ? getSystemTheme() : initial;

    queueMicrotask(() => {
      setThemeState(initial);
      setResolvedTheme(resolved);
      applyTheme(initial);
      setMounted(true);
    });
  }, []);

  // ── Listen for system theme changes when theme is "system" ──
  useEffect(() => {
    if (theme !== "system") return;

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = (e: MediaQueryListEvent) => {
      const resolved = e.matches ? "dark" : "light";
      setResolvedTheme(resolved);
      applyTheme("system");
    };

    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, [theme]);

  const setTheme = useCallback((newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem(STORAGE_KEY, newTheme);

    const resolved = newTheme === "system" ? getSystemTheme() : newTheme;
    setResolvedTheme(resolved);
    applyTheme(newTheme);
  }, []);

  // ── Before mount, render children without theme context ──
  // This prevents hydration mismatch
  if (!mounted) {
    return <>{children}</>;
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme, resolvedTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  // Fallback for SSR / before mount
  if (!ctx) {
    return {
      theme: "system" as Theme,
      setTheme: (_t: Theme) => {},
      resolvedTheme: "light" as const,
    };
  }
  return ctx;
}
