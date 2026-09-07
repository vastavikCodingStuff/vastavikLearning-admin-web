"use client";

import { useEffect, useState } from "react";
import { MessageSquare, Bot, User, Clock, Search, ArrowLeft } from "lucide-react";
import api from "@/lib/api";
import { AIChatSession, AIChatMessage } from "@/types/api";
import { formatDate, cn } from "@/lib/utils";

export default function AiChatsPage() {
  const [sessions, setSessions] = useState<AIChatSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<AIChatSession | null>(null);
  const [messages, setMessages] = useState<AIChatMessage[]>([]);
  const [msgLoading, setMsgLoading] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    api.get<{ sessions: AIChatSession[]; total: number }>("/admin/ai-chats")
      .then((r) => setSessions(r.data.sessions ?? []))
      .catch(() => {
        setSessions([
          { session_id: "sess_1", uid: "uid_0", student_name: "Parth Shah", model_used: "mistral-god", message_count: 12, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
          { session_id: "sess_2", uid: "uid_1", student_name: "Ananya Mehta", model_used: "gemini-3.7-flash", message_count: 5, created_at: new Date(Date.now() - 3600000).toISOString(), updated_at: new Date(Date.now() - 3600000).toISOString() },
          { session_id: "sess_3", uid: "uid_2", student_name: "Rohan Gupta", model_used: "mistral-god", message_count: 28, created_at: new Date(Date.now() - 7200000).toISOString(), updated_at: new Date(Date.now() - 7200000).toISOString() },
        ]);
      })
      .finally(() => setLoading(false));
  }, []);

  const openSession = (session: AIChatSession) => {
    setSelected(session);
    setMsgLoading(true);
    api.get<{ messages: AIChatMessage[] }>(`/admin/ai-chats/${session.session_id}`)
      .then((r) => setMessages(r.data.messages ?? []))
      .catch(() => {
        setMessages([
          { role: "user", content: "Explain polymorphism in Java", timestamp: new Date().toISOString() },
          { role: "assistant", content: "Polymorphism in Java means the ability of an object to take many forms. There are two types:\n\n1. **Compile-time polymorphism** (Method Overloading)\n2. **Runtime polymorphism** (Method Overriding)\n\nExample:\n```java\nclass Animal {\n  void sound() { System.out.println(\"Generic sound\"); }\n}\nclass Dog extends Animal {\n  void sound() { System.out.println(\"Bark\"); }\n}\n```", timestamp: new Date(Date.now() + 2000).toISOString(), model: session.model_used },
          { role: "user", content: "Can you give me more examples?", timestamp: new Date(Date.now() + 5000).toISOString() },
        ]);
      })
      .finally(() => setMsgLoading(false));
  };

  const filtered = sessions.filter((s) =>
    s.student_name.toLowerCase().includes(search.toLowerCase()) ||
    s.model_used.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-col md:flex-row gap-4 h-[calc(100vh-6.5rem)] sm:h-[calc(100vh-8.5rem)]">
      {/* Session list */}
      <div className={cn(
        "w-full md:w-80 flex-shrink-0 flex flex-col h-full",
        selected ? "hidden md:flex" : "flex"
      )}>
        <div className="relative mb-3 flex-shrink-0">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search sessions…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400 w-full"
          />
        </div>
        <div className="flex-1 overflow-y-auto space-y-2 pr-0.5">
          {loading
            ? Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="bg-white rounded-xl p-4 animate-pulse">
                  <div className="h-3 bg-slate-100 rounded w-3/4 mb-2" />
                  <div className="h-2.5 bg-slate-100 rounded w-1/2" />
                </div>
              ))
            : filtered.map((s) => (
                <button
                  key={s.session_id}
                  onClick={() => openSession(s)}
                  className={`w-full text-left bg-white rounded-xl p-4 shadow-sm border transition-all ${
                    selected?.session_id === s.session_id
                      ? "border-orange-400 ring-2 ring-orange-100"
                      : "border-slate-100 hover:border-orange-200"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-7 h-7 bg-orange-100 rounded-full flex items-center justify-center text-orange-600 text-xs font-bold">
                      {s.student_name.charAt(0)}
                    </div>
                    <span className="text-sm font-medium text-slate-800 truncate">{s.student_name}</span>
                  </div>
                  <p className="text-xs text-slate-400">{s.model_used} · {s.message_count} messages</p>
                  <p className="text-xs text-slate-300 mt-0.5">{formatDate(s.updated_at)}</p>
                </button>
              ))}
        </div>
      </div>

      {/* Chat viewer */}
      <div className={cn(
        "flex-1 bg-white rounded-xl shadow-sm border border-slate-100 flex flex-col overflow-hidden h-full",
        !selected ? "hidden md:flex" : "flex"
      )}>
        {selected ? (
          <>
            <div className="px-4 sm:px-5 py-3 sm:py-4 border-b border-slate-100 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <button
                  onClick={() => setSelected(null)}
                  className="md:hidden p-1.5 -ml-1 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                  aria-label="Back to sessions"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <MessageSquare className="w-5 h-5 text-orange-500 flex-shrink-0 hidden sm:block" />
                <div className="min-w-0">
                  <p className="font-semibold text-slate-800 text-sm truncate">{selected.student_name}&apos;s Session</p>
                  <p className="text-xs text-slate-400 truncate">Model: {selected.model_used} · {selected.message_count} messages</p>
                </div>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3">
              {msgLoading
                ? <div className="flex justify-center py-8"><div className="animate-spin w-6 h-6 border-4 border-orange-500 border-t-transparent rounded-full" /></div>
                : messages.map((m, i) => (
                    <div key={i} className={`flex gap-2 sm:gap-3 ${m.role === "user" ? "flex-row-reverse" : ""}`}>
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${m.role === "user" ? "bg-orange-100" : "bg-slate-100"}`}>
                        {m.role === "user"
                          ? <User className="w-3.5 h-3.5 text-orange-600" />
                          : <Bot className="w-3.5 h-3.5 text-slate-600" />}
                      </div>
                      <div className={`rounded-xl px-3.5 sm:px-4 py-2.5 sm:py-3 max-w-[88%] sm:max-w-[75%] text-sm ${m.role === "user" ? "bg-orange-500 text-white" : "bg-slate-50 text-slate-800 border border-slate-100"}`}>
                        <pre className="whitespace-pre-wrap font-sans text-xs sm:text-sm break-words">{m.content}</pre>
                        <p className={`text-[10px] sm:text-xs mt-1 ${m.role === "user" ? "text-orange-200" : "text-slate-400"} flex items-center gap-1`}>
                          <Clock className="w-2.5 h-2.5" /> {formatDate(m.timestamp)}
                        </p>
                      </div>
                    </div>
                  ))}
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-slate-400">
            <div className="text-center">
              <MessageSquare className="w-10 h-10 mx-auto mb-3 opacity-40" />
              <p className="text-sm">Select a session to view the chat</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
