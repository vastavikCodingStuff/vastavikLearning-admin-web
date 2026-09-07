"use client";

import { useState } from "react";
import { useRouteStatus } from "@/hooks/useRouteStatus";
import { Settings, RefreshCw, Wifi, WifiOff, Server, Info } from "lucide-react";
import { cn } from "@/lib/utils";

const ROUTE_DESCRIPTIONS: Record<string, string> = {
  ai_chat: "AI Tutor — Mistral / Gemini proxy endpoint",
  code_execution: "Judge0 online code runner proxy",
  conversations: "Peer chat WebSocket + REST messaging",
  payments: "Payment gateway order creation & webhooks",
  live_class: "WebRTC Live Classroom signaling server",
  doubts: "Doubt ticket submission with file upload",
  notifications: "FCM push notification dispatch",
};

export default function SystemPage() {
  const { health, loading, error, refetch, toggleRoute } = useRouteStatus();
  const [toggling, setToggling] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const handleToggle = async (feature: string) => {
    setToggling(feature);
    try {
      const newState = await toggleRoute(feature);
      setToastMsg(`${feature} is now ${newState ? "🟢 ONLINE" : "🔴 OFFLINE"}`);
      setTimeout(() => setToastMsg(null), 3000);
    } catch (e) {
      setToastMsg(`Failed to toggle ${feature}`);
      setTimeout(() => setToastMsg(null), 3000);
    } finally {
      setToggling(null);
    }
  };

  const routes = health?.route_status ?? {};
  const uptimeHours = health ? (health.uptime_seconds / 3600).toFixed(1) : "—";

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Toast */}
      {toastMsg && (
        <div className="fixed top-5 right-5 z-50 bg-slate-800 text-white px-4 py-3 rounded-xl text-sm shadow-xl animate-bounce">
          {toastMsg}
        </div>
      )}

      {/* Server health banner */}
      <div className={cn(
        "rounded-xl p-5 border flex items-start gap-4",
        loading ? "bg-slate-50 border-slate-200" :
        error ? "bg-red-50 border-red-200" :
        "bg-green-50 border-green-200"
      )}>
        <Server className={cn("w-6 h-6 mt-0.5", loading ? "text-slate-400" : error ? "text-red-500" : "text-green-500")} />
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-slate-800">Backend Server Status</h3>
            <button
              onClick={refetch}
              className="text-xs text-slate-500 hover:text-orange-500 flex items-center gap-1 transition-colors"
            >
              <RefreshCw className="w-3 h-3" /> Refresh
            </button>
          </div>
          {loading ? (
            <div className="h-3 bg-slate-200 rounded w-32 mt-1 animate-pulse" />
          ) : error ? (
            <p className="text-sm text-red-600 mt-1">{error}</p>
          ) : (
            <div className="flex gap-4 mt-1 text-sm text-slate-600">
              <span className="flex items-center gap-1 text-green-700 font-medium">
                <Wifi className="w-3.5 h-3.5" /> {health?.status ?? "healthy"}
              </span>
              <span className="text-slate-400">Uptime: {uptimeHours}h</span>
              <span className="text-slate-400">Env: {health?.environment}</span>
            </div>
          )}
        </div>
      </div>

      {/* Circuit Breaker Controls */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
          <Settings className="w-4 h-4 text-orange-500" />
          <h3 className="font-semibold text-slate-800 text-sm">Circuit Breaker Controls</h3>
          <div className="ml-auto hidden sm:flex items-center gap-1 text-xs text-slate-400">
            <Info className="w-3.5 h-3.5" /> Toggle routes without restarting the server
          </div>
        </div>

        <div className="divide-y divide-slate-50">
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="px-5 py-4 flex items-center justify-between animate-pulse">
                <div>
                  <div className="h-3 bg-slate-100 rounded w-32 mb-2" />
                  <div className="h-2.5 bg-slate-100 rounded w-48" />
                </div>
                <div className="h-6 w-11 bg-slate-100 rounded-full" />
              </div>
            ))
          ) : Object.entries(routes).length === 0 ? (
            <div className="px-5 py-8 text-center text-slate-400 text-sm">
              No routes found. Backend may not be running.
            </div>
          ) : (
            Object.entries(routes).map(([feature, enabled]) => (
              <div key={feature} className="px-5 py-4 flex items-center justify-between">
                <div className="flex items-start gap-3">
                  {enabled
                    ? <Wifi className="w-4 h-4 text-green-500 mt-0.5" />
                    : <WifiOff className="w-4 h-4 text-red-400 mt-0.5" />}
                  <div>
                    <p className="font-mono text-sm text-slate-800">{feature}</p>
                    <p className="text-xs text-slate-400">
                      {ROUTE_DESCRIPTIONS[feature] ?? "Backend feature route"}
                    </p>
                  </div>
                </div>

                {/* Toggle switch */}
                <button
                  onClick={() => handleToggle(feature)}
                  disabled={toggling === feature}
                  className={cn(
                    "relative w-11 h-6 rounded-full transition-colors focus:outline-none disabled:opacity-50",
                    enabled ? "bg-green-500" : "bg-slate-300"
                  )}
                >
                  <span
                    className={cn(
                      "absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform",
                      enabled ? "translate-x-5" : "translate-x-0"
                    )}
                  />
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* API Info */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5">
        <h3 className="font-semibold text-slate-800 text-sm mb-3">API Endpoints</h3>
        <div className="space-y-1.5">
          {[
            { label: "Base URL", value: process.env.NEXT_PUBLIC_API_BASE_URL || "https://vastaviklearning-backend-app.onrender.com" },
            { label: "API Docs", value: "/docs" },
            { label: "Health Check", value: "/health" },
            { label: "Admin Routes", value: "/admin/routes" },
          ].map((item) => (
            <div key={item.label} className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 text-sm">
              <span className="text-slate-400 w-24 text-xs">{item.label}</span>
              <code className="text-slate-700 bg-slate-50 px-2 py-0.5 rounded text-xs break-all">{item.value}</code>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
