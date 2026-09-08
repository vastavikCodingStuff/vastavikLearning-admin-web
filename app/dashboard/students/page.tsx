"use client";

import { useEffect, useState } from "react";
import { Users, Search, Crown, ChevronRight, Trash2, Archive, ShieldAlert, FileText, MessageSquare, CreditCard } from "lucide-react";
import api from "@/lib/api";
import { StudentProfile, ArchivedStudent, PaginatedResponse } from "@/types/api";
import { formatDate, cn } from "@/lib/utils";
import Link from "next/link";

export default function StudentsPage() {
  const [activeTab, setActiveTab] = useState<"active" | "archived">("active");

  // Active students state
  const [data, setData] = useState<PaginatedResponse<StudentProfile> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  // Archived/banned students state
  const [archivedData, setArchivedData] = useState<PaginatedResponse<ArchivedStudent> | null>(null);
  const [archivedLoading, setArchivedLoading] = useState(false);
  const [archivedSearch, setArchivedSearch] = useState("");
  const [archivedPage, setArchivedPage] = useState(1);
  const [selectedArchive, setSelectedArchive] = useState<ArchivedStudent | null>(null);

  const loadActive = (p: number, q: string) => {
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

  const loadArchived = (p: number, q: string) => {
    setArchivedLoading(true);
    api.get<PaginatedResponse<ArchivedStudent>>("/admin/students/archived", {
      params: { page: p, page_size: 20, search: q },
    })
      .then((r) => setArchivedData(r.data))
      .catch((err) => {
        console.error("Failed to load archived students:", err);
        setArchivedData({ items: [], total: 0, page: 1, page_size: 20, has_more: false });
      })
      .finally(() => setArchivedLoading(false));
  };

  useEffect(() => {
    if (activeTab === "active") {
      loadActive(page, search);
    } else {
      loadArchived(archivedPage, archivedSearch);
    }
  }, [activeTab, page, search, archivedPage, archivedSearch]);

  const handleDeleteStudent = async (uid: string, name: string) => {
    const confirmed = confirm(
      `Are you sure you want to ban and delete student "${name}"?\n\n` +
      `• All active data will be purged from primary storage.\n` +
      `• Their mobile app session will be revoked immediately.\n` +
      `• Their complete data snapshot will be saved in separate archived storage.\n` +
      `• They will be required to register a fresh account to rejoin.`
    );
    if (!confirmed) return;

    // Optimistic UI removal from active list
    setData((prev) =>
      prev
        ? {
            ...prev,
            items: prev.items.filter((s) => s.uid !== uid),
            total: Math.max(0, prev.total - 1),
          }
        : null
    );

    try {
      await api.delete(`/admin/students/${uid}`);
      // Refresh archived list in background
      loadArchived(1, "");
    } catch (err) {
      console.error("Failed to ban and delete student:", err);
      alert("Failed to delete student. Please verify backend connection.");
      loadActive(page, search);
    }
  };

  const students = data?.items ?? [];
  const archivedStudents = archivedData?.items ?? [];

  return (
    <div className="space-y-5">
      {/* Tab Switcher: Active Students vs Banned & Archived Records */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
        <button
          onClick={() => setActiveTab("active")}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all",
            activeTab === "active"
              ? "bg-orange-500 text-white shadow-sm"
              : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          )}
        >
          <Users className="w-4 h-4" />
          <span>Active Students</span>
          <span className="ml-1.5 px-2 py-0.5 rounded-full text-[10px] bg-white/20 text-white">
            {data?.total ?? 0}
          </span>
        </button>

        <button
          onClick={() => setActiveTab("archived")}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all",
            activeTab === "archived"
              ? "bg-rose-600 text-white shadow-sm"
              : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          )}
        >
          <Archive className="w-4 h-4" />
          <span>Banned & Archived Storage</span>
          <span className="ml-1.5 px-2 py-0.5 rounded-full text-[10px] bg-white/20 text-white">
            {archivedData?.total ?? 0}
          </span>
        </button>
      </div>

      {/* Error notification */}
      {error && activeTab === "active" && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-xl px-4 py-3 text-xs flex items-center justify-between">
          <span>{error}</span>
          <button
            onClick={() => loadActive(page, search)}
            className="font-semibold underline ml-3 hover:text-amber-900 transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      {/* ACTIVE STUDENTS TAB */}
      {activeTab === "active" && (
        <>
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
            <span className="text-xs sm:text-sm text-slate-500">{data?.total ?? 0} active students</span>
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
                            No active students found.
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
                            <div className="flex items-center gap-2">
                              <Link
                                href={`/dashboard/students/${s.uid}`}
                                className="text-orange-500 hover:text-orange-600 flex items-center gap-1 text-xs font-medium"
                              >
                                View <ChevronRight className="w-3 h-3" />
                              </Link>
                              <button
                                onClick={() => handleDeleteStudent(s.uid, s.name)}
                                className="p-1 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 transition-colors"
                                title="Ban & Delete Student"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
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
        </>
      )}

      {/* BANNED & ARCHIVED STORAGE TAB */}
      {activeTab === "archived" && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-xs text-rose-800 dark:text-rose-200 flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-sm">Separately Archived Student Records</p>
              <p className="mt-0.5 opacity-90">
                These students have been permanently banned and removed from active app storage. Their historical data snapshots are securely preserved here for administrative audit. Banned accounts cannot log back in without creating a new account.
              </p>
            </div>
          </div>

          {/* Toolbar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search archived students…"
                value={archivedSearch}
                onChange={(e) => { setArchivedSearch(e.target.value); setArchivedPage(1); }}
                className="pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-400 w-full"
              />
            </div>
            <span className="text-xs sm:text-sm text-slate-500">{archivedData?.total ?? 0} archived records</span>
          </div>

          {/* Archived Table */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-100">
                  <tr>
                    {["Archived Student", "Banned & Archived Date", "Reason", "Banned By", "Archived Snapshot", "Actions"].map((h) => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {archivedLoading ? (
                    Array.from({ length: 3 }).map((_, i) => (
                      <tr key={i}>
                        {Array.from({ length: 6 }).map((_, j) => (
                          <td key={j} className="px-4 py-3">
                            <div className="h-4 bg-slate-100 rounded animate-pulse w-24" />
                          </td>
                        ))}
                      </tr>
                    ))
                  ) : archivedStudents.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-12 text-slate-400">
                        <Archive className="w-8 h-8 mx-auto mb-2 opacity-30" />
                        No archived or banned students found.
                      </td>
                    </tr>
                  ) : (
                    archivedStudents.map((s) => (
                      <tr key={s.uid} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-rose-100 text-rose-700 rounded-full flex items-center justify-center font-bold text-xs flex-shrink-0">
                              {s.name?.charAt(0) || "B"}
                            </div>
                            <div>
                              <p className="font-semibold text-slate-800">{s.name}</p>
                              <p className="text-xs text-slate-400">{s.email || "No email"} · <span className="font-mono">{s.uid}</span></p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-600 whitespace-nowrap">
                          {formatDate(s.archived_at)}
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-700">
                            {s.reason || "Banned by administrator"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-500">{s.banned_by}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2 text-xs text-slate-600">
                            <span className="flex items-center gap-1" title="Archived AI chats">
                              <MessageSquare className="w-3 h-3 text-slate-400" />
                              {s.chats_count ?? 0}
                            </span>
                            <span className="flex items-center gap-1" title="Archived notes">
                              <FileText className="w-3 h-3 text-slate-400" />
                              {s.notes_count ?? 0}
                            </span>
                            <span className="flex items-center gap-1" title="Archived payments">
                              <CreditCard className="w-3 h-3 text-slate-400" />
                              {s.transactions_count ?? 0}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => setSelectedArchive(s)}
                            className="text-xs font-medium text-orange-500 hover:text-orange-600 flex items-center gap-1"
                          >
                            Inspect Snapshot <ChevronRight className="w-3 h-3" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Modal to inspect archived snapshot */}
          {selectedArchive && (
            <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto">
                <div className="flex items-start justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                      Archived Snapshot: {selectedArchive.name}
                    </h3>
                    <p className="text-xs text-slate-500">UID: {selectedArchive.uid}</p>
                  </div>
                  <button
                    onClick={() => setSelectedArchive(null)}
                    className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                  >
                    ✕
                  </button>
                </div>

                <div className="space-y-3 text-xs">
                  <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl space-y-1">
                    <p><strong className="text-slate-700 dark:text-slate-300">Email:</strong> {selectedArchive.email}</p>
                    <p><strong className="text-slate-700 dark:text-slate-300">Archived At:</strong> {formatDate(selectedArchive.archived_at)}</p>
                    <p><strong className="text-slate-700 dark:text-slate-300">Banned By:</strong> {selectedArchive.banned_by}</p>
                    <p><strong className="text-slate-700 dark:text-slate-300">Status:</strong> {selectedArchive.status}</p>
                    <p><strong className="text-slate-700 dark:text-slate-300">Reason:</strong> {selectedArchive.reason}</p>
                  </div>

                  <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl space-y-1">
                    <p className="font-bold text-slate-800 dark:text-slate-200">Preserved User Attributes:</p>
                    <pre className="p-2 rounded bg-slate-900 text-slate-100 text-[11px] overflow-x-auto max-h-48">
                      {JSON.stringify(selectedArchive.user_data || {}, null, 2)}
                    </pre>
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    onClick={() => setSelectedArchive(null)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
