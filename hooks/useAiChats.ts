import { useEffect, useState, useCallback } from "react";
import api from "@/lib/api";
import { AIChatSession, AIChatMessage } from "@/types/api";

export function useAiChats(page = 1, pageSize = 20, uid?: string) {
  const [sessions, setSessions] = useState<AIChatSession[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get<{ sessions: AIChatSession[]; total: number }>("/admin/ai-chats", {
        params: { page, page_size: pageSize, uid },
      });
      setSessions(res.data.sessions ?? []);
      setTotal(res.data.total ?? 0);
    } catch {
      setError("Failed to load AI chat sessions");
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, uid]);

  useEffect(() => { fetch(); }, [fetch]);

  return { sessions, total, loading, error, refetch: fetch };
}

export function useAiChatMessages(sessionId: string) {
  const [messages, setMessages] = useState<AIChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!sessionId) return;
    setLoading(true);
    api.get<{ messages: AIChatMessage[] }>(`/admin/ai-chats/${sessionId}`)
      .then((r) => setMessages(r.data.messages ?? []))
      .catch(() => setError("Failed to load messages"))
      .finally(() => setLoading(false));
  }, [sessionId]);

  return { messages, loading, error };
}
