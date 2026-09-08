"use client";

import { useUiStyleStore, type UiStyle } from "@/store/uiStyleStore";
import { Sparkles, Layout, Palette } from "lucide-react";
import { cn } from "@/lib/utils";

export function UiStyleSwitcher() {
  const { uiStyle, setUiStyle } = useUiStyleStore();

  return (
    <div className="px-3 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700/60 ui-switcher-container transition-all">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] font-bold tracking-wider uppercase text-slate-400 flex items-center gap-1.5 ui-switcher-label">
          <Palette className="w-3 h-3 text-orange-400" />
          UI Design Style
        </span>
        {uiStyle === "neobrutalism" && (
          <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-[#FFE500] text-black border border-black shadow-[1px_1px_0px_#000]">
            BRUTAL
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-1.5 p-1 rounded-lg bg-slate-900/90 border border-slate-700/50 ui-switcher-pills">
        {/* Normal Option */}
        <button
          type="button"
          onClick={() => setUiStyle("normal")}
          className={cn(
            "flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-md text-xs font-medium transition-all",
            uiStyle === "normal"
              ? "bg-orange-500 text-white shadow-sm font-semibold"
              : "text-slate-400 hover:text-white hover:bg-slate-800/60"
          )}
          title="Modern sleek UI"
        >
          <Layout className="w-3.5 h-3.5" />
          <span>Normal</span>
        </button>

        {/* Neo-Brutalist Option */}
        <button
          type="button"
          onClick={() => setUiStyle("neobrutalism")}
          className={cn(
            "flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-md text-xs font-medium transition-all",
            uiStyle === "neobrutalism"
              ? "bg-[#FFE500] text-black font-extrabold border-2 border-black shadow-[2px_2px_0px_#000] scale-[1.02]"
              : "text-slate-400 hover:text-white hover:bg-slate-800/60"
          )}
          title="Punchy Neo-Brutalist theme with black borders and offset shadows"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Brutalist</span>
        </button>
      </div>
    </div>
  );
}
