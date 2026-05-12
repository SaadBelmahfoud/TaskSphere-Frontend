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
 * Additionally, this provider manages color themes (ocean, sunset, forest,
 * berry, slate) which are independent of light/dark mode. The color theme
 * changes the primary hue and accent colors while light/dark controls
 * the overall brightness scheme.
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
type ColorTheme = "ocean" | "sunset" | "forest" | "berry" | "slate";

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  resolvedTheme: "light" | "dark";
  colorTheme: ColorTheme;
  setColorTheme: (colorTheme: ColorTheme) => void;
}

const ThemeContext = createContext<ThemeContextType | null>(null);

const STORAGE_KEY = "tasksphere-theme";
const COLOR_THEME_STORAGE_KEY = "tasksphere-color-theme";

const COLOR_THEMES: ColorTheme[] = ["ocean", "sunset", "forest", "berry", "slate"];

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

function applyColorTheme(colorTheme: ColorTheme) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;

  // Remove any existing color theme attribute
  root.removeAttribute("data-color-theme");

  // Set the new color theme (ocean is default, but we still set it for clarity)
  root.setAttribute("data-color-theme", colorTheme);
}

function isValidColorTheme(value: string | null): value is ColorTheme {
  return value !== null && COLOR_THEMES.includes(value as ColorTheme);
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("system");
  const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">("light");
  const [colorTheme, setColorThemeState] = useState<ColorTheme>("ocean");
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

    const storedColorTheme = localStorage.getItem(COLOR_THEME_STORAGE_KEY);
    const initialColorTheme = isValidColorTheme(storedColorTheme) ? storedColorTheme : "ocean";

    queueMicrotask(() => {
      setThemeState(initial);
      setResolvedTheme(resolved);
      applyTheme(initial);
      setColorThemeState(initialColorTheme);
      applyColorTheme(initialColorTheme);
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

  const setColorTheme = useCallback((newColorTheme: ColorTheme) => {
    setColorThemeState(newColorTheme);
    localStorage.setItem(COLOR_THEME_STORAGE_KEY, newColorTheme);
    applyColorTheme(newColorTheme);
  }, []);

  // ── Before mount, render children without theme context ──
  // This prevents hydration mismatch
  if (!mounted) {
    return <>{children}</>;
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme, resolvedTheme, colorTheme, setColorTheme }}>
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
      setTheme: (_theme: Theme) => {},
      resolvedTheme: "light" as const,
      colorTheme: "ocean" as ColorTheme,
      setColorTheme: (_colorTheme: ColorTheme) => {},
    };
  }
  return ctx;
}

export type { ColorTheme };
export { COLOR_THEMES };
