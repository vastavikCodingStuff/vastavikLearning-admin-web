"use client";

import { create } from "zustand";

export type Theme = "light" | "dark" | "system";

interface ThemeState {
  theme: Theme;
  resolvedTheme: "light" | "dark";
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  initTheme: () => void;
}

function getSystemTheme(): "light" | "dark" {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function applyTheme(theme: Theme): "light" | "dark" {
  if (typeof window === "undefined") return "light";
  const resolved = theme === "system" ? getSystemTheme() : theme;
  const root = document.documentElement;

  if (resolved === "dark") {
    root.classList.add("dark");
    root.setAttribute("data-theme", "dark");
  } else {
    root.classList.remove("dark");
    root.setAttribute("data-theme", "light");
  }

  localStorage.setItem("vastavik_admin_theme", theme);
  return resolved;
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  theme: "system",
  resolvedTheme: "light",

  initTheme: () => {
    if (typeof window === "undefined") return;
    const stored = (localStorage.getItem("vastavik_admin_theme") as Theme) || "system";
    const resolved = applyTheme(stored);
    set({ theme: stored, resolvedTheme: resolved });

    // Listen for OS theme changes if user chose "system"
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = () => {
      if (get().theme === "system") {
        const currentResolved = applyTheme("system");
        set({ resolvedTheme: currentResolved });
      }
    };

    try {
      mediaQuery.addEventListener("change", handleChange);
    } catch {
      mediaQuery.addListener(handleChange);
    }
  },

  setTheme: (theme: Theme) => {
    const resolved = applyTheme(theme);
    set({ theme, resolvedTheme: resolved });
  },

  toggleTheme: () => {
    const current = get().resolvedTheme;
    const next = current === "dark" ? "light" : "dark";
    const resolved = applyTheme(next);
    set({ theme: next, resolvedTheme: resolved });
  },
}));
