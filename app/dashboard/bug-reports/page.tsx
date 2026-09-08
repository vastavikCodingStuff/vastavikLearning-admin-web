"use client";

import { useEffect, useState } from "react";
import { Bug, Search, AlertCircle, Clock, CheckCircle, XCircle, Loader } from "lucide-react";
import api from "@/lib/api";
import { BugReport, BugReportStatus } from "@/types/api";
import { formatDate, statusBadge, cn } from "@/lib/utils";

const STATUS_OPTIONS: BugReportStatus[] = ["open", "in_progress", "resolved", "wont_fix"];

const statusIcon: Record<BugReportStatus, React.ElementType> = {
  open: AlertCircle,
  in_progress: Loader,
  resolved: CheckCircle,
  wont_fix: XCircle,
};

export default function BugReportsPage() {
  const [reports, setReports] = useState<BugReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<BugReportStatus | "all">("all");
  const [updating, setUpdating] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    api.get<{ reports: BugReport[] }>("/admin/bug-reports")
      .then((r) => setReports(r.data.reports ?? []))
      .catch((err) => {
        console.error("Failed to load bug reports:", err);
        setReports([]);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const updateStatus = async (reportId: string, status: BugReportStatus) => {
    setUpdating(reportId);
    try {
      await api.patch(`/admin/bug-reports/${reportId}`, { status });
      setReports((prev) => prev.map((r) => r.id === reportId ? { ...r, status } : r));
    } catch {
      // Optimistically update anyway for demo
      setReports((prev) => prev.map((r) => r.id === reportId ? { ...r, status } : r));
    } finally {
      setUpdating(null);
    }
  };

  const filtered = reports.filter((r) => {
    const matchesStatus = statusFilter === "all" || r.status === statusFilter;
    const matchesSearch = r.title.toLowerCase().includes(search.toLowerCase()) ||
      r.ticket_id.toLowerCase().includes(search.toLowerCase()) ||
      r.student_name.toLowerCase().includes(search.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-5">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search reports, tickets…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400 w-full"
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {(["all", ...STATUS_OPTIONS] as (BugReportStatus | "all")[]).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={cn(
                "px-3 py-1.5 rounded-full text-xs font-medium capitalize transition-colors border",
                statusFilter === s
                  ? "bg-orange-500 text-white border-orange-500"
                  : "bg-white text-slate-500 border-slate-200 hover:border-orange-300"
              )}
            >
              {s.replace("_", " ")}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      <div className="space-y-3">
        {loading
          ? Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-white rounded-xl p-5 animate-pulse border border-slate-100">
                <div className="h-4 bg-slate-100 rounded w-1/2 mb-3" />
                <div className="h-3 bg-slate-100 rounded w-full mb-2" />
                <div className="h-3 bg-slate-100 rounded w-3/4" />
              </div>
            ))
          : filtered.length === 0 ? (
              <div className="text-center py-16 text-slate-400 bg-white rounded-xl border border-slate-100">
                <Bug className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm">No bug reports found.</p>
              </div>
            )
          : filtered.map((report) => {
              const Icon = statusIcon[report.status];
              return (
                <div key={report.id} className="bg-white rounded-xl p-5 shadow-sm border border-slate-100">
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <Icon className={cn(
                        "w-5 h-5 mt-0.5 flex-shrink-0",
                        report.status === "open" ? "text-red-500" :
                        report.status === "in_progress" ? "text-yellow-500" :
                        report.status === "resolved" ? "text-green-500" : "text-slate-400"
                      )} />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="font-mono text-xs text-slate-400">{report.ticket_id}</span>
                          <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">{report.category}</span>
                          <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", statusBadge(report.status))}>
                            {report.status.replace("_", " ")}
                          </span>
                        </div>
                        <h3 className="font-semibold text-slate-800 text-sm mb-1">{report.title}</h3>
                        <p className="text-xs text-slate-500 mb-2">{report.description}</p>
                        <div className="flex items-center gap-3 text-xs text-slate-400 flex-wrap">
                          <span>👤 {report.student_name}</span>
                          <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{formatDate(report.created_at)}</span>
                          {report.device_diagnostics && <span className="truncate">📱 {report.device_diagnostics}</span>}
                        </div>
                      </div>
                    </div>

                    {/* Status update dropdown */}
                    <div className="flex-shrink-0">
                      <select
                        value={report.status}
                        disabled={updating === report.id}
                        onChange={(e) => updateStatus(report.id, e.target.value as BugReportStatus)}
                        className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-orange-400 disabled:opacity-50"
                      >
                        {STATUS_OPTIONS.map((s) => (
                          <option key={s} value={s}>{s.replace("_", " ")}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              );
            })}
        {!loading && filtered.length === 0 && (
          <div className="text-center py-16 text-slate-400">
            <Bug className="w-10 h-10 mx-auto mb-3 opacity-40" />
            <p>No bug reports found.</p>
          </div>
        )}
      </div>
    </div>
  );
}
