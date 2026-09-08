"use client";

import { useEffect, useState } from "react";
import {
  Plus,
  Search,
  RefreshCcw,
  Trash2,
  Terminal,
  Eye,
  EyeOff,
  Sparkles,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import api from "@/lib/api";
import { PredictOutputSet } from "@/types/api";
import { CreatePracticeModal } from "@/components/practice/CreatePracticeModal";

export default function PracticePredictOutputPage() {
  const [sets, setSets] = useState<PredictOutputSet[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [difficultyFilter, setDifficultyFilter] = useState<string>("all");
  const [createOpen, setCreateOpen] = useState(false);
  const [revealedOutputs, setRevealedOutputs] = useState<Record<string, boolean>>({});
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const r = await api.get<{ sets: PredictOutputSet[] }>("/admin/practice/predict-output");
      setSets(r.data.sets ?? []);
    } catch {
      try {
        const studentResp = await api.get<PredictOutputSet[]>("/api/v1/practice/predict-output");
        setSets(studentResp.data ?? []);
      } catch {
        setSets([]);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const toggleReveal = (id: string) => {
    setRevealedOutputs((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to delete "${title}"?`)) return;
    setDeletingId(id);
    try {
      await api.delete(`/admin/practice/predict-output/${id}`);
      setSets((prev) => prev.filter((s) => s.id !== id));
      showToast("success", `Set "${title}" deleted successfully`);
    } catch (err: any) {
      showToast("error", err?.response?.data?.detail ?? "Failed to delete set");
    } finally {
      setDeletingId(null);
    }
  };

  const showToast = (type: "success" | "error", message: string) => {
    setNotification({ type, message });
    setTimeout(() => {
      setNotification(null);
    }, 4000);
  };

  const filtered = sets.filter((s) => {
    const matchesSearch =
      s.title.toLowerCase().includes(search.toLowerCase()) ||
      s.topic.toLowerCase().includes(search.toLowerCase()) ||
      (s.code_snippet && s.code_snippet.toLowerCase().includes(search.toLowerCase()));

    const matchesDifficulty =
      difficultyFilter === "all" ||
      s.difficulty.toLowerCase() === difficultyFilter.toLowerCase();

    return matchesSearch && matchesDifficulty;
  });

  const getDifficultyBadge = (difficulty: string) => {
    const d = (difficulty || "easy").toLowerCase();
    if (d === "hard") {
      return "bg-rose-100 text-rose-800 border-rose-200";
    }
    if (d === "medium") {
      return "bg-amber-100 text-amber-800 border-amber-200";
    }
    return "bg-emerald-100 text-emerald-800 border-emerald-200";
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {notification && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg border text-sm font-medium transition-all animate-bounce ${
            notification.type === "success"
              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
              : "bg-rose-50 text-rose-800 border-rose-200"
          }`}
        >
          {notification.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600" />
          )}
          {notification.message}
        </div>
      )}

      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 flex-1">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search predict output sets…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 w-full bg-white shadow-sm"
            />
          </div>

          <select
            value={difficultyFilter}
            onChange={(e) => setDifficultyFilter(e.target.value)}
            className="px-3 py-2 text-sm border border-slate-200 rounded-xl bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
          >
            <option value="all">All Difficulties</option>
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={load}
            disabled={loading}
            className="flex items-center gap-1.5 border border-slate-200 hover:bg-slate-50 text-slate-600 px-3 py-2 rounded-xl text-sm transition-colors shadow-sm bg-white disabled:opacity-50"
            title="Refresh from backend"
          >
            <RefreshCcw className={`w-4 h-4 ${loading ? "animate-spin text-blue-500" : ""}`} />
          </button>
          <button
            onClick={() => setCreateOpen(true)}
            className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors shadow-sm w-full sm:w-auto"
          >
            <Plus className="w-4 h-4" /> New Predict Output Set
          </button>
        </div>
      </div>

      <CreatePracticeModal
        isOpen={createOpen}
        onClose={() => setCreateOpen(false)}
        contentType="predict_output"
        onCreated={() => load()}
      />

      {/* Cards list */}
      <div className="grid grid-cols-1 gap-5">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="bg-white rounded-2xl p-6 border-2 border-slate-200 shadow-sm animate-pulse space-y-4"
            >
              <div className="flex justify-between items-center">
                <div className="h-6 bg-slate-200 rounded-lg w-1/3" />
                <div className="h-6 bg-slate-200 rounded-full w-20" />
              </div>
              <div className="h-4 bg-slate-100 rounded w-1/4" />
              <div className="h-32 bg-slate-900/10 rounded-xl" />
            </div>
          ))
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-2xl p-16 text-center border-2 border-dashed border-slate-200 shadow-sm">
            <Terminal className="w-12 h-12 mx-auto mb-3 text-slate-300" />
            <h3 className="text-base font-semibold text-slate-700 mb-1">
              No Predict the Output Sets Found
            </h3>
            <p className="text-sm text-slate-400 mb-5 max-w-md mx-auto">
              {search || difficultyFilter !== "all"
                ? "No problem sets match your current filters. Try resetting the filters."
                : "Add code tracing problem sets for students to practice predicting console output."}
            </p>
            <button
              onClick={() => setCreateOpen(true)}
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" /> Create First Set
            </button>
          </div>
        ) : (
          filtered.map((set, idx) => {
            const isRevealed = !!revealedOutputs[set.id];
            const lines = (set.code_snippet || "").split("\n");

            return (
              <div
                key={set.id}
                className="bg-white rounded-2xl border-2 border-slate-900 shadow-[3px_3px_0px_0px_rgba(15,23,42,1)] p-5 sm:p-6 transition-all hover:translate-y-[-1px]"
              >
                {/* Header row */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="bg-blue-600 text-white font-bold text-xs px-3 py-1 rounded-xl shadow-sm tracking-wide uppercase">
                      SET {set.set_number ?? idx + 1}
                    </span>
                    <h3 className="text-base sm:text-lg font-bold text-slate-900">
                      {set.title}
                    </h3>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs font-semibold px-3 py-0.5 rounded-full border ${getDifficultyBadge(
                        set.difficulty
                      )}`}
                    >
                      {set.difficulty || "Easy"}
                    </span>
                    <button
                      onClick={() => handleDelete(set.id, set.title)}
                      disabled={deletingId === set.id}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      title="Delete set"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Subtitle row */}
                <div className="flex items-center gap-2 text-xs font-medium text-slate-500 mb-4">
                  <span className="flex items-center gap-1 text-slate-600">
                    <Sparkles className="w-3.5 h-3.5 text-blue-500" />
                    {set.source === "ai" ? "AI Generated" : "Sir Curated"}
                  </span>
                  <span>•</span>
                  <span className="text-blue-600 font-semibold">{set.question_count || "10 Questions"}</span>
                  <span>•</span>
                  <span className="text-slate-500">{set.topic}</span>
                </div>

                {/* VS Code styled Code Snippet block */}
                <div className="rounded-xl overflow-hidden border border-slate-800 bg-[#1e1e1e] text-slate-100 shadow-inner mb-4">
                  {/* Window title bar */}
                  <div className="bg-[#2d2d2d] px-4 py-2 flex items-center justify-between border-b border-[#3e3e3e]">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#ff5f56]" />
                      <span className="w-2.5 h-2.5 rounded-full bg-[#ffbd2e]" />
                      <span className="w-2.5 h-2.5 rounded-full bg-[#27c93f]" />
                    </div>
                    <span className="text-[11px] font-mono font-semibold tracking-wider text-slate-400 uppercase">
                      JAVA
                    </span>
                  </div>

                  {/* Code body with line numbers */}
                  <div className="p-4 font-mono text-xs sm:text-sm overflow-x-auto leading-relaxed">
                    <table>
                      <tbody>
                        {lines.map((line, lineIdx) => (
                          <tr key={lineIdx} className="hover:bg-[#282828]">
                            <td className="pr-4 text-right select-none text-slate-500 text-xs w-6">
                              {lineIdx + 1}
                            </td>
                            <td className="text-slate-100 whitespace-pre">
                              {line}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Bottom Bar: Expected Output & Info */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-3 border-t border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-slate-500">
                      Predict console output
                    </span>
                    {set.expected_output && (
                      <button
                        onClick={() => toggleReveal(set.id)}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-2.5 py-1 rounded-lg transition-colors"
                      >
                        {isRevealed ? (
                          <>
                            <EyeOff className="w-3 h-3" /> Hide Output
                          </>
                        ) : (
                          <>
                            <Eye className="w-3 h-3" /> Reveal Expected Output
                          </>
                        )}
                      </button>
                    )}
                  </div>

                  {/* Expected output preview box if revealed */}
                  {isRevealed && set.expected_output && (
                    <div className="bg-slate-900 text-emerald-400 font-mono text-xs px-3 py-1.5 rounded-lg border border-slate-700 shadow-sm flex items-center gap-2">
                      <span className="text-slate-400 font-sans text-[11px]">Output:</span>
                      <span className="font-bold">{set.expected_output}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
