"use client";

import { useEffect, useRef, useState } from "react";
import api from "@/lib/api";

export type HealthState = "idle" | "checking" | "ok" | "slow" | "down";

/**
 * Pings /health periodically and exposes a banner-friendly state.
 *
 * Specifically tuned to absorb Render free-tier cold starts (15-50s). On
 * the first request after idle, the backend takes a long time to wake
 * up. We surface that as a 'warming up' banner instead of letting every
 * page call fail with axios timeout.
 */
export function useHealthWatchdog(intervalMs: number = 60_000) {
  const [state, setState] = useState<HealthState>("idle");
  const [latencyMs, setLatencyMs] = useState<number | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const inflight = useRef(false);

  const ping = async () => {
    if (inflight.current) return;
    inflight.current = true;
    setState((prev) => (prev === "ok" ? prev : "checking"));
    const t0 = Date.now();
    try {
      // Use a short timeout so cold-start is detected quickly. The dashboard
      // banner can show a friendly "warming up" while other pages quietly
      // retry with a longer timeout.
      await api.get("/health", { timeout: 5000 });
      const ms = Date.now() - t0;
      setLatencyMs(ms);
      if (ms > 3000) {
        setState("slow");
        setMessage(`Backend is responding but slow (${ms}ms). Render cold-start?`);
      } else {
        setState("ok");
        setMessage(null);
      }
    } catch (err: unknown) {
      const e = err as { code?: string; message?: string };
      const code = e?.code ?? "";
      const msg = e?.message ?? "";
      if (code === "ECONNABORTED" || /timeout/i.test(msg)) {
        setState("slow");
        setMessage(
          "Backend is warming up (Render cold start). First request can take 15-50s, please wait…"
        );
      } else {
        setState("down");
        setMessage("Backend is unreachable. Check the deploy status on Render.");
      }
    } finally {
      inflight.current = false;
    }
  };

  useEffect(() => {
    // Defer the initial ping to a microtask so we never call setState
    // synchronously inside the effect body.
    const id = setTimeout(ping, 0);
    const interval = setInterval(ping, intervalMs);
    return () => {
      clearTimeout(id);
      clearInterval(interval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [intervalMs]);

  return { state, latencyMs, message, refetch: ping };
}
