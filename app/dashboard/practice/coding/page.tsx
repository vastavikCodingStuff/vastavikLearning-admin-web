"use client";

import { useEffect, useState } from "react";
import { Plus, Code2, Search, ChevronDown, ChevronUp, RefreshCcw, Trash2 } from "lucide-react";
import api from "@/lib/api";
import { CodingExercise } from "@/types/api";
import { languageColor } from "@/lib/utils";
import { CreatePracticeModal } from "@/components/practice/CreatePracticeModal";

export default function PracticeCodingPage() {
  const [exercises, setExercises] = useState<CodingExercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const r = await api.get<{ exercises: CodingExercise[] }>("/admin/practice/coding");
      setExercises(r.data.exercises ?? []);
    } catch {
      setExercises([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleDeleteExercise = async (e: React.MouseEvent, exerciseId: string, title: string) => {
    e.stopPropagation();
    if (!confirm(`Are you sure you want to delete coding exercise "${title}"?`)) return;
    setExercises((prev) => prev.filter((ex) => ex.id !== exerciseId));
    try {
      await api.delete(`/admin/practice/coding/${exerciseId}`);
    } catch (err) {
      console.error("Failed to delete exercise:", err);
    }
  };

  const filtered = exercises.filter((e) =>
    e.title.toLowerCase().includes(search.toLowerCase()) ||
    e.language.toLowerCase().includes(search.toLowerCase())
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
            placeholder="Search exercises…"
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
            <Plus className="w-4 h-4" /> New Exercise
          </button>
        </div>
      </div>

      <CreatePracticeModal
        isOpen={createOpen}
        onClose={() => setCreateOpen(false)}
        contentType="coding"
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
              <Code2 className="w-10 h-10 mx-auto mb-3 opacity-40" />
              <p className="text-sm">No coding exercises yet. Click <span className="font-semibold text-orange-500">+ New Exercise</span> to add one.</p>
            </div>
          )
          : filtered.map((ex) => (
              <div key={ex.id} className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="w-full flex items-center justify-between px-5 py-4 hover:bg-slate-50 transition-colors">
                  <button
                    onClick={() => setExpanded(expanded === ex.id ? null : ex.id)}
                    className="flex-1 flex items-center gap-4 text-left min-w-0"
                  >
                    <Code2 className="w-5 h-5 text-orange-500 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-0.5">
                        <p className="font-semibold text-slate-800 text-sm">{ex.title}</p>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${languageColor(ex.language)}`}>{ex.language.toUpperCase()}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${diffColor[ex.difficulty] ?? diffColor.easy}`}>{ex.difficulty}</span>
                      </div>
                      <p className="text-xs text-slate-400 truncate">{ex.description}</p>
                    </div>
                    {expanded === ex.id ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                  </button>
                  <button
                    onClick={(e) => handleDeleteExercise(e, ex.id, ex.title)}
                    className="p-1.5 ml-2 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 transition-colors flex-shrink-0"
                    title="Delete Coding Exercise"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {expanded === ex.id && (
                  <div className="border-t border-slate-100 p-5 space-y-4">
                    <div>
                      <p className="text-xs font-semibold text-slate-500 mb-1.5">Description</p>
                      <p className="text-sm text-slate-700">{ex.description}</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs font-semibold text-slate-500 mb-1.5">Starter Code</p>
                        <pre className="bg-slate-900 text-green-400 text-xs rounded-lg p-3 overflow-x-auto whitespace-pre-wrap">{ex.starter_code || "(none)"}</pre>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-slate-500 mb-1.5">Solution</p>
                        <pre className="bg-slate-900 text-blue-300 text-xs rounded-lg p-3 overflow-x-auto whitespace-pre-wrap">{ex.solution_code || "(none)"}</pre>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-500 mb-1.5">Test Cases ({(ex.test_cases ?? []).length})</p>
                      {(ex.test_cases ?? []).map((tc, i) => (
                        <div key={i} className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-2">
                          <div>
                            <p className="text-xs text-slate-400 mb-0.5">Input</p>
                            <pre className="bg-slate-50 text-slate-700 text-xs rounded p-2 border border-slate-100 whitespace-pre-wrap">{tc.input || "(none)"}</pre>
                          </div>
                          <div>
                            <p className="text-xs text-slate-400 mb-0.5">Expected Output</p>
                            <pre className="bg-green-50 text-green-800 text-xs rounded p-2 border border-green-100 whitespace-pre-wrap">{tc.expected_output || "(none)"}</pre>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
      </div>
    </div>
  );
}
