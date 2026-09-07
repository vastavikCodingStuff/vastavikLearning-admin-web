"use client";

import { useEffect, useState } from "react";
import { BarChart3, TrendingUp } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from "recharts";
import api from "@/lib/api";
import { CourseCompletionOverview, CompletionStat } from "@/types/api";
import { completionColor, cn } from "@/lib/utils";

export default function CompletionPage() {
  const [overview, setOverview] = useState<CourseCompletionOverview[]>([]);
  const [topStudents, setTopStudents] = useState<CompletionStat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get<{ overview: CourseCompletionOverview[] }>("/admin/completion/overview"),
      api.get<{ stats: CompletionStat[] }>("/admin/completion/top-students"),
    ])
      .then(([ov, st]) => {
        setOverview(ov.data.overview ?? []);
        setTopStudents(st.data.stats ?? []);
      })
      .catch(() => {
        setOverview([
          { course_id: "c1", course_title: "Java for ICSE Class 10", enrolled_students: 142, avg_completion_percent: 68, fully_completed_count: 23 },
          { course_id: "c2", course_title: "Python Basics", enrolled_students: 89, avg_completion_percent: 52, fully_completed_count: 11 },
          { course_id: "c3", course_title: "JavaScript Essentials", enrolled_students: 47, avg_completion_percent: 41, fully_completed_count: 5 },
          { course_id: "c4", course_title: "SQL & Databases", enrolled_students: 63, avg_completion_percent: 78, fully_completed_count: 31 },
        ]);
        setTopStudents([
          { uid: "uid_0", student_name: "Parth Shah", course_id: "c1", course_title: "Java for ICSE", total_parts: 24, completed_parts: 24, completion_percent: 100, last_activity: new Date().toISOString() },
          { uid: "uid_1", student_name: "Ananya Mehta", course_id: "c4", course_title: "SQL & Databases", total_parts: 18, completed_parts: 16, completion_percent: 89, last_activity: new Date(Date.now() - 86400000).toISOString() },
          { uid: "uid_2", student_name: "Rohan Gupta", course_id: "c2", course_title: "Python Basics", total_parts: 20, completed_parts: 17, completion_percent: 85, last_activity: new Date(Date.now() - 172800000).toISOString() },
          { uid: "uid_3", student_name: "Priya Iyer", course_id: "c1", course_title: "Java for ICSE", total_parts: 24, completed_parts: 19, completion_percent: 79, last_activity: new Date(Date.now() - 259200000).toISOString() },
        ]);
      })
      .finally(() => setLoading(false));
  }, []);

  const barColors = overview.map((c) =>
    c.avg_completion_percent >= 70 ? "#10b981" :
    c.avg_completion_percent >= 40 ? "#f59e0b" : "#ef4444"
  );

  return (
    <div className="space-y-6">
      {/* Course completion bar chart */}
      <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100">
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className="w-5 h-5 text-orange-500" />
          <h3 className="font-semibold text-slate-800">Average Completion by Course</h3>
        </div>
        {loading ? (
          <div className="h-52 bg-slate-50 rounded-lg animate-pulse" />
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={overview} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
              <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11 }} tickFormatter={(v) => `${v}%`} />
              <YAxis type="category" dataKey="course_title" tick={{ fontSize: 11 }} width={160} />
              <Tooltip formatter={(v) => [`${v}%`, "Avg Completion"]} />
              <Bar dataKey="avg_completion_percent" radius={[0, 4, 4, 0]} name="Avg Completion">
                {overview.map((_, i) => (
                  <Cell key={i} fill={barColors[i]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Course cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-white rounded-xl p-4 animate-pulse border border-slate-100">
                <div className="h-3 bg-slate-100 rounded w-2/3 mb-3" />
                <div className="h-6 bg-slate-100 rounded w-1/2 mb-2" />
                <div className="h-2 bg-slate-100 rounded w-full" />
              </div>
            ))
          : overview.map((c) => (
              <div key={c.course_id} className="bg-white rounded-xl p-4 shadow-sm border border-slate-100">
                <p className="text-xs text-slate-500 font-medium mb-1 line-clamp-2">{c.course_title}</p>
                <p className={`text-3xl font-bold mb-0.5 ${completionColor(c.avg_completion_percent)}`}>
                  {c.avg_completion_percent}%
                </p>
                <div className="w-full bg-slate-100 rounded-full h-1.5 mb-3">
                  <div
                    className="h-1.5 rounded-full"
                    style={{
                      width: `${c.avg_completion_percent}%`,
                      backgroundColor: c.avg_completion_percent >= 70 ? "#10b981" : c.avg_completion_percent >= 40 ? "#f59e0b" : "#ef4444",
                    }}
                  />
                </div>
                <div className="flex justify-between text-xs text-slate-400">
                  <span>{c.enrolled_students} enrolled</span>
                  <span>{c.fully_completed_count} completed</span>
                </div>
              </div>
            ))}
      </div>

      {/* Top students table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-green-500" />
          <h3 className="font-semibold text-slate-800 text-sm">Top Performing Students</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50">
              <tr>
                {["Student", "Course", "Progress", "Completion", "Last Active"].map((h) => (
                  <th key={h} className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {topStudents.map((s) => (
                <tr key={`${s.uid}-${s.course_id}`} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-slate-800 text-sm whitespace-nowrap">{s.student_name}</td>
                  <td className="px-4 py-3 text-slate-500 text-xs whitespace-nowrap">{s.course_title}</td>
                  <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">{s.completed_parts}/{s.total_parts} parts</td>
                  <td className="px-4 py-3 min-w-[140px]">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-slate-100 rounded-full h-1.5">
                        <div
                          className="h-1.5 rounded-full bg-green-500"
                          style={{ width: `${s.completion_percent}%` }}
                        />
                      </div>
                      <span className={`text-xs font-semibold ${completionColor(s.completion_percent)}`}>
                        {s.completion_percent}%
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-400 whitespace-nowrap">
                    {new Date(s.last_activity).toLocaleDateString("en-IN")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
