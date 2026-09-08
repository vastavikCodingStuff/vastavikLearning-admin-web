"use client";

import { useEffect, useState } from "react";
import { Plus, ClipboardList, Search, ChevronDown, ChevronUp, RefreshCcw } from "lucide-react";
import api from "@/lib/api";
import { QuizSet, QuizQuestion } from "@/types/api";
import { formatDate } from "@/lib/utils";
import { CreatePracticeModal } from "@/components/practice/CreatePracticeModal";

export default function PracticeQuizPage() {
  const [sets, setSets] = useState<QuizSet[]>([]);
  const [questions, setQuestions] = useState<Record<string, QuizQuestion[]>>({});
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const r = await api.get<{ sets: QuizSet[] }>("/admin/practice/quiz");
      setSets(r.data.sets ?? []);
    } catch {
      setSets([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const toggleSet = async (setId: string) => {
    if (expanded === setId) { setExpanded(null); return; }
    setExpanded(setId);
    if (questions[setId]) return;
    try {
      const r = await api.get<{ questions: QuizQuestion[] }>(`/admin/practice/quiz/${setId}/questions`);
      setQuestions((prev) => ({ ...prev, [setId]: r.data.questions ?? [] }));
    } catch {
      setQuestions((prev) => ({ ...prev, [setId]: [] }));
    }
  };

  const filtered = sets.filter((s) =>
    s.title.toLowerCase().includes(search.toLowerCase()) ||
    s.subject.toLowerCase().includes(search.toLowerCase())
  );

  const diffColor: Record<string, string> = {
    easy: "bg-green-100 text-green-700",
    medium: "bg-yellow-100 text-yellow-700",
    hard: "bg-red-100 text-red-700",
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search quiz sets…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400 w-full"
          />
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={load}
            className="flex items-center gap-1.5 border border-slate-200 hover:bg-slate-50 text-slate-600 px-3 py-2 rounded-lg text-sm transition-colors"
            title="Refresh from backend"
          >
            <RefreshCcw className="w-4 h-4" />
          </button>
          <button
            onClick={() => setCreateOpen(true)}
            className="flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors w-full sm:w-auto"
          >
            <Plus className="w-4 h-4" /> New Quiz Set
          </button>
        </div>
      </div>

      <CreatePracticeModal
        isOpen={createOpen}
        onClose={() => setCreateOpen(false)}
        contentType="quiz"
        onCreated={() => load()}
      />

      <div className="space-y-3">
        {loading
          ? Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-white rounded-xl p-5 animate-pulse border border-slate-100">
                <div className="h-4 bg-slate-100 rounded w-1/2 mb-2" />
                <div className="h-3 bg-slate-100 rounded w-1/4" />
              </div>
            ))
          : filtered.length === 0
          ? (
            <div className="text-center py-16 text-slate-400">
              <ClipboardList className="w-10 h-10 mx-auto mb-3 opacity-40" />
              <p className="text-sm">No quiz sets yet. Click <span className="font-semibold text-orange-500">+ New Quiz Set</span> to add one.</p>
            </div>
          )
          : filtered.map((set) => (
              <div key={set.id} className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                <button
                  onClick={() => toggleSet(set.id)}
                  className="w-full flex items-center gap-4 px-5 py-4 hover:bg-slate-50 transition-colors text-left"
                >
                  <ClipboardList className="w-5 h-5 text-orange-500 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-800 text-sm">{set.title}</p>
                    <p className="text-xs text-slate-400">{set.subject} · {set.question_count} questions · {formatDate(set.created_at)}</p>
                  </div>
                  {expanded === set.id ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                </button>
                {expanded === set.id && (
                  <div className="border-t border-slate-100 divide-y divide-slate-50">
                    {(questions[set.id] ?? []).length === 0 && (
                      <div className="px-5 py-4 text-xs text-slate-400">No questions in this set yet.</div>
                    )}
                    {(questions[set.id] ?? []).map((q, qi) => (
                      <div key={q.id} className="px-5 py-4">
                        <div className="flex items-start gap-3">
                          <span className="w-5 h-5 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                            {qi + 1}
                          </span>
                          <div className="flex-1">
                            <p className="text-sm text-slate-800 font-medium mb-2">{q.question}</p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 mb-2">
                              {q.options.map((opt, oi) => (
                                <div key={oi} className={`text-xs px-2.5 py-1.5 rounded-lg border ${oi === q.correct_index ? "bg-green-50 border-green-300 text-green-700 font-medium" : "bg-slate-50 border-slate-200 text-slate-600"}`}>
                                  {String.fromCharCode(65 + oi)}. {opt}
                                </div>
                              ))}
                            </div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${diffColor[q.difficulty] ?? diffColor.easy}`}>{q.difficulty}</span>
                              {q.explanation && <p className="text-xs text-slate-400 italic">{q.explanation}</p>}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
      </div>
    </div>
  );
}
