"use client";

import { create } from "zustand";

export type UiStyle = "normal" | "neobrutalism";

interface UiStyleState {
  uiStyle: UiStyle;
  setUiStyle: (style: UiStyle) => void;
  toggleUiStyle: () => void;
  initUiStyle: () => void;
}

function applyUiStyle(style: UiStyle): void {
  if (typeof window === "undefined") return;
  const root = document.documentElement;

  if (style === "neobrutalism") {
    root.classList.add("neobrutalism");
    root.setAttribute("data-ui-style", "neobrutalism");
  } else {
    root.classList.remove("neobrutalism");
    root.setAttribute("data-ui-style", "normal");
  }

  localStorage.setItem("vastavik_ui_style", style);
}

export const useUiStyleStore = create<UiStyleState>((set, get) => ({
  uiStyle: "normal",

  initUiStyle: () => {
    if (typeof window === "undefined") return;
    const stored = (localStorage.getItem("vastavik_ui_style") as UiStyle) || "normal";
    applyUiStyle(stored);
    set({ uiStyle: stored });
  },

  setUiStyle: (style: UiStyle) => {
    applyUiStyle(style);
    set({ uiStyle: style });
  },

  toggleUiStyle: () => {
    const next: UiStyle = get().uiStyle === "neobrutalism" ? "normal" : "neobrutalism";
    applyUiStyle(next);
    set({ uiStyle: next });
  },
}));
