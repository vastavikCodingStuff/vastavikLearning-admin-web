"use client";

import { useEffect, useState } from "react";
import { Plus, CheckSquare, Search, RefreshCcw, Trash2 } from "lucide-react";
import api from "@/lib/api";
import { MCQQuestion } from "@/types/api";
import { CreatePracticeModal } from "@/components/practice/CreatePracticeModal";

export default function PracticeMCQPage() {
  const [mcqs, setMCQs] = useState<MCQQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const r = await api.get<{ mcqs: MCQQuestion[] }>("/admin/practice/mcq");
      setMCQs(r.data.mcqs ?? []);
    } catch {
      setMCQs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleDeleteMCQ = async (id: string, question: string) => {
    if (!confirm(`Are you sure you want to delete this MCQ?\n"${question.slice(0, 60)}..."`)) return;
    setMCQs((prev) => prev.filter((m) => m.id !== id));
    try {
      await api.delete(`/admin/practice/mcq/${id}`);
    } catch (err) {
      console.error("Failed to delete MCQ:", err);
    }
  };

  const filtered = mcqs.filter((m) =>
    m.question.toLowerCase().includes(search.toLowerCase()) ||
    m.subject.toLowerCase().includes(search.toLowerCase()) ||
    (m.topic ?? "").toLowerCase().includes(search.toLowerCase())
  );

  const diffColor: Record<string, string> = {
    easy: "bg-green-100 text-green-700",
    medium: "bg-yellow-100 text-yellow-700",
    hard: "bg-red-100 text-red-700",
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search MCQs by subject, topic…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400 w-full"
          />
        </div>
        <div className="flex items-center gap-2">
          <button onClick={load} className="flex items-center gap-1.5 border border-slate-200 hover:bg-slate-50 text-slate-600 px-3 py-2 rounded-lg text-sm transition-colors" title="Refresh from backend">
            <RefreshCcw className="w-4 h-4" />
          </button>
          <button
            onClick={() => setCreateOpen(true)}
            className="flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors w-full sm:w-auto"
          >
            <Plus className="w-4 h-4" /> New MCQ
          </button>
        </div>
      </div>

      <CreatePracticeModal
        isOpen={createOpen}
        onClose={() => setCreateOpen(false)}
        contentType="mcq"
        onCreated={() => load()}
      />

      <div className="space-y-3">
        {loading
          ? Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-white rounded-xl p-5 animate-pulse border border-slate-100">
                <div className="h-4 bg-slate-100 rounded w-3/4 mb-3" />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {Array.from({ length: 4 }).map((_, j) => (
                    <div key={j} className="h-7 bg-slate-100 rounded" />
                  ))}
                </div>
              </div>
            ))
          : filtered.length === 0
          ? (
            <div className="text-center py-16 text-slate-400">
              <CheckSquare className="w-10 h-10 mx-auto mb-3 opacity-40" />
              <p className="text-sm">No MCQs yet. Click <span className="font-semibold text-orange-500">+ New MCQ</span> to add some.</p>
            </div>
          )
          : filtered.map((mcq, idx) => (
              <div key={mcq.id} className="bg-white rounded-xl p-4 sm:p-5 shadow-sm border border-slate-100">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <span className="w-6 h-6 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap gap-2 mb-1.5">
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">{mcq.subject}</span>
                        {mcq.topic && <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">{mcq.topic}</span>}
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${diffColor[mcq.difficulty] ?? diffColor.easy}`}>{mcq.difficulty}</span>
                      </div>
                      <p className="font-medium text-slate-800 text-sm">{mcq.question}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteMCQ(mcq.id, mcq.question)}
                    className="p-1.5 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 transition-colors flex-shrink-0"
                    title="Delete MCQ"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3 ml-0 sm:ml-9">
                  {mcq.options.map((opt, oi) => (
                    <div key={oi} className={`text-xs px-3 py-2 rounded-lg border ${oi === mcq.correct_index ? "bg-green-50 border-green-300 text-green-700 font-semibold" : "bg-slate-50 border-slate-200 text-slate-600"}`}>
                      {String.fromCharCode(65 + oi)}. {opt}
                      {oi === mcq.correct_index && " ✓"}
                    </div>
                  ))}
                </div>
                {mcq.explanation && <p className="text-xs text-slate-400 ml-0 sm:ml-9 italic">💡 {mcq.explanation}</p>}
              </div>
            ))}
      </div>
    </div>
  );
}
