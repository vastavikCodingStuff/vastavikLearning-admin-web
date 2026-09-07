import { useEffect, useState, useCallback } from "react";
import api from "@/lib/api";
import { StudentProfile, PaginatedResponse } from "@/types/api";

export function useStudents(page = 1, pageSize = 20, search = "") {
  const [data, setData] = useState<PaginatedResponse<StudentProfile> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get<PaginatedResponse<StudentProfile>>("/admin/students", {
        params: { page, page_size: pageSize, search },
      });
      setData(res.data);
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? "Failed to load students";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, search]);

  useEffect(() => { fetch(); }, [fetch]);

  return { data, loading, error, refetch: fetch };
}

export function useStudent(uid: string) {
  const [data, setData] = useState<StudentProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!uid) return;
    setLoading(true);
    api.get<StudentProfile>(`/admin/students/${uid}`)
      .then((r) => setData(r.data))
      .catch(() => setError("Failed to load student"))
      .finally(() => setLoading(false));
  }, [uid]);

  return { data, loading, error };
}
