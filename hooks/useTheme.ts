// hooks/useTheme.ts
"use client";

import { useEffect, useState } from "react";

export type Theme = "dark" | "light";

export function useTheme() {
  const [theme, setTheme] = useState<Theme>("dark");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem("snap_app_theme") as Theme | null;
    const initialTheme = saved || (window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark");
    setTheme(initialTheme);
    applyTheme(initialTheme);

    const handleThemeSync = (e: CustomEvent<Theme>) => {
      if (e.detail && (e.detail === "dark" || e.detail === "light")) {
        setTheme(e.detail);
        applyTheme(e.detail);
      }
    };

    window.addEventListener("snap-theme-change" as any, handleThemeSync);
    return () => {
      window.removeEventListener("snap-theme-change" as any, handleThemeSync);
    };
  }, []);

  const applyTheme = (t: Theme) => {
    const root = document.documentElement;
    if (t === "light") {
      root.classList.add("light");
      root.classList.remove("dark");
    } else {
      root.classList.add("dark");
      root.classList.remove("light");
    }
  };

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    localStorage.setItem("snap_app_theme", next);
    applyTheme(next);
    window.dispatchEvent(new CustomEvent("snap-theme-change", { detail: next }));
  };

  const setExplicitTheme = (t: Theme) => {
    setTheme(t);
    localStorage.setItem("snap_app_theme", t);
    applyTheme(t);
    window.dispatchEvent(new CustomEvent("snap-theme-change", { detail: t }));
  };

  return { theme, toggleTheme, setTheme: setExplicitTheme, mounted };
}
