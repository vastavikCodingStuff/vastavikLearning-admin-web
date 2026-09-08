"use client";

import { useEffect, useState } from "react";
import { Users, Search, Crown, ChevronRight } from "lucide-react";
import api from "@/lib/api";
import { StudentProfile, PaginatedResponse } from "@/types/api";
import { formatDate, cn } from "@/lib/utils";
import Link from "next/link";

export default function StudentsPage() {
  const [data, setData] = useState<PaginatedResponse<StudentProfile> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const load = (p: number, q: string) => {
    setLoading(true);
    setError(null);
    api.get<PaginatedResponse<StudentProfile>>("/admin/students", {
      params: { page: p, page_size: 20, search: q },
    })
      .then((r) => setData(r.data))
      .catch((err) => {
        console.error("Failed to load students:", err);
        setError("Could not connect to database to fetch students. Ensure the backend is online.");
        setData({ items: [], total: 0, page: 1, page_size: 20, has_more: false });
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(page, search); }, [page, search]);

  const students = data?.items ?? [];

  return (
    <div className="space-y-5">
      {/* Error notification */}
      {error && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-xl px-4 py-3 text-xs flex items-center justify-between">
          <span>{error}</span>
          <button
            onClick={() => load(page, search)}
            className="font-semibold underline ml-3 hover:text-amber-900 transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search name, school, board, course…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400 w-full"
          />
        </div>
        <span className="text-xs sm:text-sm text-slate-500">{data?.total ?? 0} students total</span>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                {["Student", "Enrolled Course", "Board", "Language", "Streak", "Completed", "Joined", "Plan", ""].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading
                ? Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i}>
                      {Array.from({ length: 9 }).map((_, j) => (
                        <td key={j} className="px-4 py-3">
                          <div className="h-4 bg-slate-100 rounded animate-pulse w-20" />
                        </td>
                      ))}
                    </tr>
                  ))
                : students.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="text-center py-12 text-slate-400">
                        <Users className="w-8 h-8 mx-auto mb-2 opacity-30" />
                        No students found.
                      </td>
                    </tr>
                  )
                : students.map((s) => (
                    <tr key={s.uid} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center text-orange-600 font-semibold text-xs flex-shrink-0">
                            {s.name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-medium text-slate-800">{s.name}</p>
                            <p className="text-xs text-slate-400">
                              {s.school ? `${s.school} · ` : ""}{s.email}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {s.enrolled_course ? (
                          <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                            {s.enrolled_course}
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn(
                          "text-xs px-2 py-0.5 rounded-full font-medium",
                          s.board === "ICSE" ? "bg-blue-100 text-blue-700" : "bg-purple-100 text-purple-700"
                        )}>
                          {s.board} {s.class_grade ? `· ${s.class_grade}` : ""}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-600 text-xs">{s.preferred_language}</td>
                      <td className="px-4 py-3 text-slate-700 font-medium">{s.streak_count}🔥</td>
                      <td className="px-4 py-3 text-slate-600 font-medium">{s.lessons_completed} lessons</td>
                      <td className="px-4 py-3 text-slate-400 text-xs whitespace-nowrap">{formatDate(s.created_at)}</td>
                      <td className="px-4 py-3">
                        {s.is_premium ? (
                          <span className="flex items-center gap-1 text-xs text-yellow-700 bg-yellow-100 px-2 py-0.5 rounded-full font-medium">
                            <Crown className="w-3 h-3" /> Pro
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400">Free</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <Link
                          href={`/dashboard/students/${s.uid}`}
                          className="text-orange-500 hover:text-orange-600 flex items-center gap-1 text-xs font-medium"
                        >
                          View <ChevronRight className="w-3 h-3" />
                        </Link>
                      </td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {data && data.total > data.page_size && (
          <div className="px-4 py-3 border-t border-slate-100 flex items-center justify-between">
            <p className="text-xs text-slate-500">
              Page {data.page} of {Math.ceil(data.total / data.page_size)}
            </p>
            <div className="flex gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="px-3 py-1 text-xs border border-slate-200 rounded-lg disabled:opacity-40 hover:bg-slate-50 transition-colors"
              >
                Previous
              </button>
              <button
                disabled={!data.has_more}
                onClick={() => setPage((p) => p + 1)}
                className="px-3 py-1 text-xs border border-slate-200 rounded-lg disabled:opacity-40 hover:bg-slate-50 transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
