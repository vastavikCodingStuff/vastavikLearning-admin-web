"use client";

import { useEffect, useState } from "react";
import { Plus, FileQuestion, Search, Filter, RefreshCcw } from "lucide-react";
import api from "@/lib/api";
import { PYQ } from "@/types/api";
import { CreatePracticeModal } from "@/components/practice/CreatePracticeModal";

export default function PracticePYQPage() {
  const [pyqs, setPYQs] = useState<PYQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [boardFilter, setBoardFilter] = useState<"all" | "ICSE" | "CBSE">("all");
  const [yearFilter, setYearFilter] = useState("");
  const [createOpen, setCreateOpen] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const r = await api.get<{ pyqs: PYQ[] }>("/admin/practice/pyq");
      setPYQs(r.data.pyqs ?? []);
    } catch {
      setPYQs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const years = [...new Set(pyqs.map((p) => p.year))].sort((a, b) => Number(b) - Number(a));

  const filtered = pyqs.filter((p) => {
    const matchBoard = boardFilter === "all" || p.board === boardFilter;
    const matchYear = !yearFilter || p.year === yearFilter;
    const matchSearch = p.question.toLowerCase().includes(search.toLowerCase()) ||
      p.subject.toLowerCase().includes(search.toLowerCase());
    return matchBoard && matchYear && matchSearch;
  });

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="flex flex-wrap gap-2 items-center">
          <div className="relative w-full sm:w-60">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search questions…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400 w-full"
            />
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Filter className="w-4 h-4 text-slate-400" />
            <div className="flex gap-1.5">
              {(["all", "ICSE", "CBSE"] as const).map((b) => (
                <button
                  key={b}
                  onClick={() => setBoardFilter(b)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${boardFilter === b ? "bg-orange-500 text-white border-orange-500" : "bg-white text-slate-500 border-slate-200 hover:border-orange-300"}`}
                >
                  {b === "all" ? "All Boards" : b}
                </button>
              ))}
            </div>
            <select
              value={yearFilter}
              onChange={(e) => setYearFilter(e.target.value)}
              className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-orange-400 text-slate-900 bg-white"
            >
              <option value="">All Years</option>
              {years.map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={load} className="flex items-center gap-1.5 border border-slate-200 hover:bg-slate-50 text-slate-600 px-3 py-2 rounded-lg text-sm transition-colors" title="Refresh from backend">
            <RefreshCcw className="w-4 h-4" />
          </button>
          <button
            onClick={() => setCreateOpen(true)}
            className="flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors w-full sm:w-auto"
          >
            <Plus className="w-4 h-4" /> Add PYQ
          </button>
        </div>
      </div>

      <CreatePracticeModal
        isOpen={createOpen}
        onClose={() => setCreateOpen(false)}
        contentType="pyq"
        onCreated={() => load()}
      />

      <div className="space-y-3">
        {loading
          ? Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-white rounded-xl p-5 animate-pulse border border-slate-100">
                <div className="h-4 bg-slate-100 rounded w-1/4 mb-3" />
                <div className="h-3 bg-slate-100 rounded w-full mb-2" />
                <div className="h-3 bg-slate-100 rounded w-3/4" />
              </div>
            ))
          : filtered.length === 0
          ? (
            <div className="text-center py-16 text-slate-400">
              <FileQuestion className="w-10 h-10 mx-auto mb-3 opacity-40" />
              <p className="text-sm">No PYQs yet. Click <span className="font-semibold text-orange-500">+ Add PYQ</span> to add some.</p>
            </div>
          )
          : filtered.map((pyq) => (
              <div key={pyq.id} className="bg-white rounded-xl p-5 shadow-sm border border-slate-100">
                <div className="flex items-center gap-2 mb-3 flex-wrap">
                  <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${pyq.board === "ICSE" ? "bg-blue-100 text-blue-700" : "bg-purple-100 text-purple-700"}`}>
                    {pyq.board}
                  </span>
                  <span className="text-xs bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full font-medium">{pyq.year}</span>
                  <span className="text-xs bg-orange-50 text-orange-600 px-2.5 py-1 rounded-full">{pyq.subject}</span>
                  <span className="text-xs text-slate-400 ml-auto">{pyq.marks} marks</span>
                </div>
                <div className="mb-3">
                  <p className="text-xs text-slate-400 mb-1 font-medium uppercase tracking-wide">Question</p>
                  <p className="text-sm text-slate-800 leading-relaxed">{pyq.question}</p>
                </div>
                <div className="bg-green-50 border border-green-100 rounded-lg p-3">
                  <p className="text-xs text-green-600 mb-1 font-medium uppercase tracking-wide">Model Answer</p>
                  <p className="text-xs text-green-900 leading-relaxed whitespace-pre-wrap">{pyq.solution}</p>
                </div>
              </div>
            ))}
      </div>
    </div>
  );
}
