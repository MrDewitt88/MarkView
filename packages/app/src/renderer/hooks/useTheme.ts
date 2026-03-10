import { useState, useEffect } from "react";

export type Theme = "light" | "dark";

interface UseThemeResult {
  theme: Theme;
  toggleTheme: () => void;
}

function getSystemTheme(): Theme {
  if (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-color-scheme: dark)").matches
  ) {
    return "dark";
  }
  return "light";
}

function getStoredTheme(): Theme | null {
  try {
    const stored = localStorage.getItem("markview-theme");
    if (stored === "light" || stored === "dark") {
      return stored;
    }
  } catch {
    // localStorage not available
  }
  return null;
}

/**
 * Theme hook: dark/light mode with system preference as default.
 */
export function useTheme(): UseThemeResult {
  const [theme, setTheme] = useState<Theme>(
    () => getStoredTheme() ?? getSystemTheme(),
  );

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    try {
      localStorage.setItem("markview-theme", theme);
    } catch {
      // localStorage not available
    }
  }, [theme]);

  // Listen for system theme changes
  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = (e: MediaQueryListEvent): void => {
      // Only follow system if user hasn't manually chosen
      if (!getStoredTheme()) {
        setTheme(e.matches ? "dark" : "light");
      }
    };
    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, []);

  const toggleTheme = (): void => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  };

  return { theme, toggleTheme };
}
