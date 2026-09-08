"use client";

import { useEffect } from "react";
import { useThemeStore } from "@/store/themeStore";
import { useUiStyleStore } from "@/store/uiStyleStore";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const initTheme = useThemeStore((s) => s.initTheme);
  const initUiStyle = useUiStyleStore((s) => s.initUiStyle);

  useEffect(() => {
    initTheme();
    initUiStyle();
  }, [initTheme, initUiStyle]);

  return <>{children}</>;
}
