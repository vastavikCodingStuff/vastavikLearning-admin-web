"use client";

import { useEffect, useState } from "react";
import { Code2, Search, CheckCircle, XCircle, Clock, ChevronDown, ChevronUp } from "lucide-react";
import api from "@/lib/api";
import { CodeExecutionLog } from "@/types/api";
import { formatDate, languageColor } from "@/lib/utils";

export default function CodeUsagePage() {
  const [logs, setLogs] = useState<CodeExecutionLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    api.get<{ logs: CodeExecutionLog[] }>("/admin/code-usage")
      .then((r) => setLogs(r.data.logs ?? []))
      .catch(() => {
        setLogs([
          { id: "exec_1", uid: "uid_0", student_name: "Parth Shah", language: "java", source_code: "public class Main {\n  public static void main(String[] args) {\n    System.out.println(\"Hello World\");\n  }\n}", stdout: "Hello World\n", stderr: "", status_description: "Accepted", execution_time: "0.12s", memory_kb: 4096, created_at: new Date().toISOString() },
          { id: "exec_2", uid: "uid_1", student_name: "Ananya Mehta", language: "python", source_code: "print('Hello Python')", stdout: "Hello Python\n", stderr: "", status_description: "Accepted", execution_time: "0.04s", memory_kb: 1024, created_at: new Date(Date.now() - 3600000).toISOString() },
          { id: "exec_3", uid: "uid_2", student_name: "Rohan Gupta", language: "java", source_code: "public class Test { public static void main(String[] a) { int x = 5/0; } }", stdout: "", stderr: "ArithmeticException: / by zero\n\tat Test.main(Test.java:1)", status_description: "Runtime Error", execution_time: "0.08s", memory_kb: 3072, created_at: new Date(Date.now() - 7200000).toISOString() },
        ]);
      })
      .finally(() => setLoading(false));
  }, []);

  const filtered = logs.filter((l) =>
    l.student_name.toLowerCase().includes(search.toLowerCase()) ||
    l.language.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-5">
      <div className="relative w-full sm:w-72">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Search by student or language…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400 w-full"
        />
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 divide-y divide-slate-50">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="px-5 py-4 flex gap-4 animate-pulse">
                <div className="h-4 bg-slate-100 rounded w-24" />
                <div className="h-4 bg-slate-100 rounded w-16" />
                <div className="h-4 bg-slate-100 rounded w-20" />
              </div>
            ))
          : filtered.map((log) => {
              const isAccepted = log.status_description === "Accepted";
              const isExpanded = expanded === log.id;
              return (
                <div key={log.id}>
                  <button
                    onClick={() => setExpanded(isExpanded ? null : log.id)}
                    className="w-full px-5 py-4 flex items-center gap-4 hover:bg-slate-50 transition-colors text-left"
                  >
                    {isAccepted
                      ? <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                      : <XCircle className="w-4 h-4 text-red-500 flex-shrink-0" />}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-slate-800 text-sm">{log.student_name}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${languageColor(log.language)}`}>
                          {log.language.toUpperCase()}
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${isAccepted ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                          {log.status_description}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 mt-0.5 text-xs text-slate-400">
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{log.execution_time}</span>
                        <span>{log.memory_kb} KB</span>
                        <span>{formatDate(log.created_at)}</span>
                      </div>
                    </div>
                    {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                  </button>
                  {isExpanded && (
                    <div className="px-5 pb-4 space-y-3">
                      <div>
                        <p className="text-xs font-semibold text-slate-500 mb-1">Source Code</p>
                        <pre className="bg-slate-900 text-green-400 text-xs rounded-lg p-3 overflow-x-auto">{log.source_code}</pre>
                      </div>
                      {log.stdout && (
                        <div>
                          <p className="text-xs font-semibold text-slate-500 mb-1">Output</p>
                          <pre className="bg-slate-50 text-slate-700 text-xs rounded-lg p-3 border border-slate-100">{log.stdout}</pre>
                        </div>
                      )}
                      {log.stderr && (
                        <div>
                          <p className="text-xs font-semibold text-red-500 mb-1">Error</p>
                          <pre className="bg-red-50 text-red-700 text-xs rounded-lg p-3 border border-red-100">{log.stderr}</pre>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
        {!loading && filtered.length === 0 && (
          <div className="py-12 text-center text-slate-400">
            <Code2 className="w-8 h-8 mx-auto mb-2 opacity-40" />
            <p className="text-sm">No code executions found.</p>
          </div>
        )}
      </div>
    </div>
  );
}
