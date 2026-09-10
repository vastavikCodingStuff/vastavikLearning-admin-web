"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  MessageSquare,
  Bot,
  User,
  Clock,
  Search,
  ArrowLeft,
  AlertTriangle,
  ShieldAlert,
  Trash2,
  RefreshCcw,
  Sparkles,
} from "lucide-react";
import api from "@/lib/api";
import { AIChatSession, AIChatMessage } from "@/types/api";
import { formatDate, cn } from "@/lib/utils";
import { MarkdownMessage } from "@/components/chat/MarkdownMessage";

export default function AiChatsPage() {
  const searchParams = useSearchParams();
  const filterUid = searchParams.get("uid");

  const [sessions, setSessions] = useState<AIChatSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<AIChatSession | null>(null);
  const [messages, setMessages] = useState<AIChatMessage[]>([]);
  const [msgLoading, setMsgLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [filterMode, setFilterMode] = useState<"all" | "flagged">("all");

  const loadSessions = () => {
    setLoading(true);
    const url = filterUid ? `/admin/ai-chats?uid=${encodeURIComponent(filterUid)}` : "/admin/ai-chats";
    api.get<{ sessions: AIChatSession[]; total: number; flagged_count?: number }>(url)
      .then((r) => setSessions(r.data.sessions ?? []))
      .catch((err) => {
        console.error("Failed to load AI chat sessions:", err);
        setSessions([]);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadSessions();
  }, [filterUid]);

  const openSession = (session: AIChatSession) => {
    setSelected(session);
    setMsgLoading(true);
    api.get<{ messages: AIChatMessage[]; is_flagged?: boolean; flag_reasons?: string[]; flagged_terms?: string[] }>(
      `/admin/ai-chats/${session.session_id}`
    )
      .then((r) => {
        setMessages(r.data.messages ?? []);
        if (r.data.is_flagged !== undefined) {
          setSelected((prev) =>
            prev
              ? {
                  ...prev,
                  is_flagged: r.data.is_flagged,
                  flag_reasons: r.data.flag_reasons ?? prev.flag_reasons,
                  flagged_terms: r.data.flagged_terms ?? prev.flagged_terms,
                }
              : null
          );
        }
      })
      .catch((err) => {
        console.error("Failed to load session messages:", err);
        setMessages([]);
      })
      .finally(() => setMsgLoading(false));
  };

  const handleDeleteSession = async (e: React.MouseEvent, sessionId: string) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this AI chat session? This cannot be undone.")) return;
    setSessions((prev) => prev.filter((s) => s.session_id !== sessionId));
    if (selected?.session_id === sessionId) {
      setSelected(null);
      setMessages([]);
    }
    try {
      await api.delete(`/admin/ai-chats/${sessionId}`);
    } catch (err) {
      console.error("Failed to delete chat session:", err);
    }
  };

  const flaggedCount = sessions.filter((s) => s.is_flagged).length;

  const filtered = sessions.filter((s) => {
    const matchesFilter = filterMode === "all" || s.is_flagged;
    const matchesSearch =
      s.student_name.toLowerCase().includes(search.toLowerCase()) ||
      s.model_used.toLowerCase().includes(search.toLowerCase()) ||
      (s.flag_reasons && s.flag_reasons.some((r) => r.toLowerCase().includes(search.toLowerCase()))) ||
      (s.flagged_terms && s.flagged_terms.some((t) => t.toLowerCase().includes(search.toLowerCase())));
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="flex flex-col md:flex-row gap-4 h-[calc(100vh-6.5rem)] sm:h-[calc(100vh-8.5rem)]">
      {/* Session list */}
      <div className={cn(
        "w-full md:w-84 lg:w-96 flex-shrink-0 flex flex-col h-full",
        selected ? "hidden md:flex" : "flex"
      )}>
        {/* Header & Filter Tabs */}
        <div className="space-y-2 mb-3 flex-shrink-0">
          {filterUid && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-2.5 flex items-center justify-between text-xs text-orange-900">
              <span>Filtered for UID: <strong className="font-mono">{filterUid}</strong></span>
              <Link href="/dashboard/ai-chats" className="underline font-semibold hover:text-orange-700 ml-2">Clear</Link>
            </div>
          )}
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search student, model, bad queries…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 pr-4 py-2 text-xs sm:text-sm border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400 w-full shadow-sm"
              />
            </div>
            <button
              onClick={loadSessions}
              className="p-2 border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors shadow-sm"
              title="Refresh sessions"
            >
              <RefreshCcw className="w-4 h-4" />
            </button>
          </div>

          {/* Filter Pills */}
          <div className="flex gap-1.5">
            <button
              onClick={() => setFilterMode("all")}
              className={cn(
                "flex-1 py-1.5 px-3 rounded-lg text-xs font-medium border transition-colors flex items-center justify-center gap-1.5",
                filterMode === "all"
                  ? "bg-orange-500 text-white border-orange-500 shadow-sm"
                  : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-orange-300"
              )}
            >
              <span>All Sessions</span>
              <span className={cn(
                "px-1.5 py-0.2 rounded-full text-[10px]",
                filterMode === "all" ? "bg-orange-600 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-500"
              )}>
                {sessions.length}
              </span>
            </button>
            <button
              onClick={() => setFilterMode("flagged")}
              className={cn(
                "flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold border transition-colors flex items-center justify-center gap-1.5",
                filterMode === "flagged"
                  ? "bg-rose-600 text-white border-rose-600 shadow-sm"
                  : "bg-white dark:bg-slate-900 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-900/60 hover:bg-rose-50 dark:hover:bg-rose-950/20"
              )}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Flagged Queries</span>
              {flaggedCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-rose-700 text-white">
                  {flaggedCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Sessions list container */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-0.5">
          {loading
            ? Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="bg-white dark:bg-slate-900 rounded-xl p-4 animate-pulse border border-slate-100 dark:border-slate-800">
                  <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded w-3/4 mb-2" />
                  <div className="h-2.5 bg-slate-100 dark:bg-slate-800 rounded w-1/2" />
                </div>
              ))
            : filtered.length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-sm bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 p-6">
                  <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <p>{filterMode === "flagged" ? "No flagged queries found. All student chats are clean!" : "No chat sessions found."}</p>
                </div>
              )
            : filtered.map((s) => (
                <div
                  key={s.session_id}
                  onClick={() => openSession(s)}
                  className={`w-full text-left bg-white dark:bg-slate-900 rounded-xl p-3.5 shadow-sm border transition-all cursor-pointer relative ${
                    s.is_flagged
                      ? selected?.session_id === s.session_id
                        ? "border-rose-500 ring-2 ring-rose-100 dark:ring-rose-950"
                        : "border-rose-200 dark:border-rose-900/60 hover:border-rose-300"
                      : selected?.session_id === s.session_id
                        ? "border-orange-400 ring-2 ring-orange-100 dark:ring-orange-950"
                        : "border-slate-100 dark:border-slate-800 hover:border-orange-200"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                        s.is_flagged ? "bg-rose-100 text-rose-700 dark:bg-rose-900/60 dark:text-rose-200" : "bg-orange-100 text-orange-600 dark:bg-orange-950 dark:text-orange-300"
                      }`}>
                        {s.student_name.charAt(0)}
                      </div>
                      <span className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">
                        {s.student_name}
                      </span>
                    </div>

                    <button
                      onClick={(e) => handleDeleteSession(e, s.session_id)}
                      className="p-1 rounded-lg text-slate-300 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950 transition-colors"
                      title="Delete Session"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Safety Flag Alert Badge */}
                  {s.is_flagged && (
                    <div className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900/60 px-2 py-0.5 rounded-md">
                      <AlertTriangle className="w-3 h-3 flex-shrink-0 text-rose-600" />
                      <span className="truncate">
                        Flagged: {s.flag_reasons?.join(", ") || "Prohibited query"}
                      </span>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span className="truncate">{s.model_used} · {s.message_count} msgs</span>
                    <span className="text-[11px] text-slate-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {formatDate(s.updated_at)}
                    </span>
                  </div>
                </div>
              ))}
        </div>
      </div>

      {/* Chat viewer */}
      <div className={cn(
        "flex-1 bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col overflow-hidden h-full",
        !selected ? "hidden md:flex" : "flex"
      )}>
        {selected ? (
          <>
            {/* Viewer Header */}
            <div className="px-4 sm:px-5 py-3 sm:py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3 bg-slate-50/50 dark:bg-slate-950/40">
              <div className="flex items-center gap-3 min-w-0">
                <button
                  onClick={() => setSelected(null)}
                  className="md:hidden p-1.5 -ml-1 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white rounded-lg transition-colors"
                  aria-label="Back to sessions"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <MessageSquare className="w-5 h-5 text-orange-500 flex-shrink-0 hidden sm:block" />
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-slate-800 dark:text-slate-100 text-sm truncate">
                      {selected.student_name}&apos;s Session
                    </p>
                    {selected.is_flagged && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300 border border-rose-200 dark:border-rose-800 px-2 py-0.5 rounded-full">
                        <AlertTriangle className="w-2.5 h-2.5" /> Flagged
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 truncate">Model: {selected.model_used} · {selected.message_count} messages</p>
                </div>
              </div>

              <button
                onClick={(e) => handleDeleteSession(e, selected.session_id)}
                className="flex items-center gap-1.5 text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950 px-2.5 py-1.5 rounded-lg border border-rose-200 dark:border-rose-900 transition-colors"
                title="Delete Session"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Delete Session</span>
              </button>
            </div>

            {/* Safety Banner if flagged */}
            {selected.is_flagged && (
              <div className="bg-rose-50 dark:bg-rose-950/40 border-b border-rose-200 dark:border-rose-900 px-4 py-2.5 flex items-start gap-2.5 text-xs text-rose-800 dark:text-rose-300">
                <ShieldAlert className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                <div className="min-w-0 flex-1">
                  <p className="font-bold">Safety Moderation Alert: Bad Search/Query Detected</p>
                  <p className="text-[11px] text-rose-600 dark:text-rose-400 mt-0.5">
                    Flagged Categories: <span className="font-semibold">{selected.flag_reasons?.join(", ") || "Prohibited topic"}</span>
                    {selected.flagged_terms && selected.flagged_terms.length > 0 && (
                      <> · Prohibited Terms: <span className="font-mono bg-rose-100 dark:bg-rose-900 px-1 py-0.5 rounded text-[10px]">{selected.flagged_terms.join(", ")}</span></>
                    )}
                  </p>
                </div>
              </div>
            )}

            {/* Chat message bubbles */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
              {msgLoading
                ? <div className="flex justify-center py-12"><div className="animate-spin w-6 h-6 border-4 border-orange-500 border-t-transparent rounded-full" /></div>
                : messages.length === 0 ? (
                    <div className="text-center py-12 text-slate-400 text-xs">No messages recorded in this session.</div>
                  )
                : messages.map((m, i) => (
                    <div key={i} className={`flex gap-2.5 sm:gap-3 ${m.role === "user" ? "flex-row-reverse" : ""}`}>
                      {/* Avatar */}
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm ${
                        m.role === "user"
                          ? m.is_flagged
                            ? "bg-rose-600 text-white"
                            : "bg-orange-500 text-white"
                          : "bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700"
                      }`}>
                        {m.role === "user"
                          ? <User className="w-4 h-4" />
                          : <Bot className="w-4 h-4 text-orange-500" />}
                      </div>

                      {/* Bubble */}
                      <div className={`rounded-2xl px-4 py-3 max-w-[92%] sm:max-w-[80%] shadow-sm ${
                        m.role === "user"
                          ? m.is_flagged
                            ? "bg-rose-600 text-white border border-rose-400"
                            : "bg-orange-500 text-white"
                          : "bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-800"
                      }`}>
                        {/* Flag banner on user message */}
                        {m.is_flagged && m.role === "user" && (
                          <div className="flex items-center gap-1 text-[11px] font-bold text-amber-200 bg-rose-800/80 px-2 py-0.5 rounded-md mb-2 w-fit">
                            <AlertTriangle className="w-3 h-3 text-amber-300" />
                            <span>Flagged: {m.flag_reasons?.join(", ") || m.flag_reason || "Prohibited Term"}</span>
                          </div>
                        )}

                        {m.role === "assistant" ? (
                          <MarkdownMessage content={m.content} />
                        ) : (
                          <p className="text-xs sm:text-sm font-sans whitespace-pre-wrap break-words leading-relaxed font-medium">
                            {m.content}
                          </p>
                        )}

                        <div className={`text-[10px] mt-1.5 flex items-center gap-1 ${
                          m.role === "user" ? "text-orange-100 justify-end" : "text-slate-400 justify-start"
                        }`}>
                          <Clock className="w-2.5 h-2.5 opacity-70" /> {formatDate(m.timestamp)}
                          {m.model && <span className="opacity-60 ml-1">· {m.model}</span>}
                        </div>
                      </div>
                    </div>
                  ))}
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-slate-400 p-8">
            <div className="text-center max-w-sm">
              <div className="w-12 h-12 rounded-2xl bg-orange-50 dark:bg-orange-950/50 flex items-center justify-center mx-auto mb-3 text-orange-500 border border-orange-100 dark:border-orange-900">
                <Sparkles className="w-6 h-6" />
              </div>
              <p className="font-semibold text-slate-700 dark:text-slate-200 text-sm mb-1">Select an AI Chat Session</p>
              <p className="text-xs text-slate-400">Review student questions, solution traces, code blocks, or audit any flagged safety queries.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
