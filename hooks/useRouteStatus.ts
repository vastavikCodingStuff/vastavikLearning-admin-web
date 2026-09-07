import { useEffect, useState, useCallback } from "react";
import api from "@/lib/api";
import { HealthResponse, RouteStatus } from "@/types/api";

export function useRouteStatus() {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get<HealthResponse>("/health");
      setHealth(res.data);
    } catch {
      setError("Failed to fetch route status");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const toggleRoute = useCallback(async (feature: string) => {
    try {
      const res = await api.post<{ enabled: boolean }>(`/admin/routes/${feature}/toggle`);
      setHealth((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          route_status: {
            ...prev.route_status,
            [feature]: res.data.enabled,
          } as RouteStatus,
        };
      });
      return res.data.enabled;
    } catch {
      throw new Error(`Failed to toggle ${feature}`);
    }
  }, []);

  return { health, loading, error, refetch: fetch, toggleRoute };
}
