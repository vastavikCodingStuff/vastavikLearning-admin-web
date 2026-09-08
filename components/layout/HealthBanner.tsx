"use client";

import { useState } from "react";
import { AlertCircle, Loader2, WifiOff, X } from "lucide-react";
import { useHealthWatchdog } from "@/hooks/useHealthWatchdog";
import { cn } from "@/lib/utils";

/**
 * Top-of-dashboard status banner. Auto-dismisses once the backend is
 * healthy; otherwise surfaces 'warming up' / 'down' with a clear CTA.
 *
 * Goal: replace the previous behaviour where the System page's red
 * banner sat there for 15-50s during Render cold starts, making the
 * admin look broken when it was just slow.
 */
export function HealthBanner() {
  const { state, latencyMs, message, refetch } = useHealthWatchdog(60_000);
  const [dismissed, setDismissed] = useState(false);

  // Auto-reset dismissed state when we go back to OK (so the banner
  // can re-appear if the backend goes down again later).
  if ((state as string) === "ok" && dismissed) {
    setDismissed(false);
  }

  if ((state as string) === "ok" || dismissed) return null;

  const tone =
    state === "down"
      ? "bg-red-50 border-red-300 text-red-800"
      : state === "slow"
      ? "bg-orange-50 border-orange-300 text-orange-800"
      : "bg-amber-50 border-amber-300 text-amber-800";

  const Icon = state === "down" ? WifiOff : state === "slow" ? AlertCircle : Loader2;
  const head =
    state === "down"
      ? "Backend is not reachable"
      : state === "slow"
      ? "Backend is warming up…"
      : "Checking backend…";

  return (
    <div
      role="status"
      className={cn(
        "rounded-xl border-2 px-4 py-3 flex items-start gap-3 shadow-sm",
        tone
      )}
    >
      <Icon
        className={cn(
          "w-5 h-5 mt-0.5 flex-shrink-0",
          state === "checking" && "animate-spin"
        )}
      />
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm">{head}</p>
        <p className="text-xs mt-0.5">
          {message ?? "Reaching the Render server…"}
          {latencyMs != null && state === "ok" && (
            <span className="ml-2 text-slate-500">({latencyMs}ms)</span>
          )}
        </p>
      </div>
      <div className="flex items-center gap-1">
        <button
          onClick={refetch}
          className="text-xs underline hover:no-underline"
          title="Retry"
        >
          Retry
        </button>
        <button
          onClick={() => setDismissed(true)}
          aria-label="Dismiss"
          className="p-1 rounded hover:bg-black/10"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
