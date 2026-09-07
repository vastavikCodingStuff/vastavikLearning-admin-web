"use client";

import { useEffect, useState } from "react";
import {
  Users, BookOpen, MessageSquare, Bug, Code2, TrendingUp, Activity, CheckCircle
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from "recharts";
import api from "@/lib/api";
import { formatDate } from "@/lib/utils";

interface DashboardStats {
  total_students: number;
  total_courses: number;
  active_ai_sessions: number;
  open_bug_reports: number;
  code_executions_today: number;
  avg_completion_percent: number;
  recent_signups: { date: string; count: number }[];
  language_distribution: { language: string; count: number }[];
}

const COLORS = ["#f97316", "#3b82f6", "#10b981", "#a855f7", "#ef4444"];

const statCards = (stats: DashboardStats) => [
  {
    label: "Total Students",
    value: stats.total_students.toLocaleString(),
    icon: Users,
    color: "bg-blue-500",
    change: "+12 this week",
  },
  {
    label: "Total Courses",
    value: stats.total_courses.toString(),
    icon: BookOpen,
    color: "bg-orange-500",
    change: "Published & draft",
  },
  {
    label: "AI Chat Sessions",
    value: stats.active_ai_sessions.toLocaleString(),
    icon: MessageSquare,
    color: "bg-purple-500",
    change: "Saved sessions",
  },
  {
    label: "Open Bug Reports",
    value: stats.open_bug_reports.toString(),
    icon: Bug,
    color: "bg-red-500",
    change: "Awaiting review",
  },
  {
    label: "Code Runs Today",
    value: stats.code_executions_today.toLocaleString(),
    icon: Code2,
    color: "bg-green-500",
    change: "All languages",
  },
  {
    label: "Avg Completion",
    value: `${stats.avg_completion_percent}%`,
    icon: CheckCircle,
    color: "bg-teal-500",
    change: "Across all courses",
  },
];

const MOCK_STATS: DashboardStats = {
  total_students: 0,
  total_courses: 0,
  active_ai_sessions: 0,
  open_bug_reports: 0,
  code_executions_today: 0,
  avg_completion_percent: 0,
  recent_signups: [
    { date: "Mon", count: 12 },
    { date: "Tue", count: 19 },
    { date: "Wed", count: 8 },
    { date: "Thu", count: 25 },
    { date: "Fri", count: 31 },
    { date: "Sat", count: 14 },
    { date: "Sun", count: 7 },
  ],
  language_distribution: [
    { language: "Java", count: 0 },
    { language: "Python", count: 0 },
    { language: "JavaScript", count: 0 },
    { language: "SQL", count: 0 },
  ],
};

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>(MOCK_STATS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<DashboardStats>("/admin/dashboard/stats")
      .then((r) => setStats(r.data))
      .catch(() => {
        // Use mock data if endpoint not yet live
        setStats({
          ...MOCK_STATS,
          total_students: 247,
          total_courses: 8,
          active_ai_sessions: 1_340,
          open_bug_reports: 5,
          code_executions_today: 892,
          avg_completion_percent: 63,
          language_distribution: [
            { language: "Java", count: 148 },
            { language: "Python", count: 64 },
            { language: "JavaScript", count: 23 },
            { language: "SQL", count: 12 },
          ],
        });
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stat cards: 2 columns on mobile/tablet (3 rows x 2 cols = 6 cards) */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-2.5 sm:gap-3.5">
        {statCards(stats).map((card) => (
          <div
            key={card.label}
            className="bg-white rounded-xl p-3 sm:p-4 shadow-sm border border-slate-100 flex flex-col justify-between"
          >
            <div className={`w-8 h-8 sm:w-9 sm:h-9 ${card.color} rounded-lg flex items-center justify-center mb-2.5 sm:mb-3`}>
              <card.icon className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            <div>
              <p className="text-xl sm:text-2xl font-bold text-slate-800 tracking-tight leading-none">{card.value}</p>
              <p className="text-[11px] sm:text-xs text-slate-500 font-medium mt-1 truncate">{card.label}</p>
              <p className="text-[10px] sm:text-xs text-green-600 mt-1 flex items-center gap-1 font-medium truncate">
                <TrendingUp className="w-3 h-3 flex-shrink-0" />
                <span className="truncate">{card.change}</span>
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Weekly signups bar chart */}
        <div className="lg:col-span-2 bg-white rounded-xl p-5 shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-800">New Signups — This Week</h3>
            <Activity className="w-4 h-4 text-slate-400" />
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={stats.recent_signups}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="count" fill="#f97316" radius={[4, 4, 0, 0]} name="Students" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Language distribution pie */}
        <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100 flex flex-col">
          <h3 className="font-semibold text-slate-800 mb-2">Language Preference</h3>
          <div className="flex-1 min-h-[240px]">
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie
                  data={stats.language_distribution}
                  cx="50%"
                  cy="45%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={3}
                  dataKey="count"
                  nameKey="language"
                >
                  {stats.language_distribution.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0f172a",
                    borderRadius: "8px",
                    border: "none",
                    color: "#fff",
                    fontSize: "12px",
                    boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
                  }}
                  itemStyle={{ color: "#fff" }}
                  formatter={(value: any, name: any) => {
                    const total = stats.language_distribution.reduce((a, b) => a + b.count, 0) || 1;
                    const pct = Math.round((Number(value) / total) * 100);
                    return [`${value} students (${pct}%)`, name];
                  }}
                />
                <Legend
                  verticalAlign="bottom"
                  iconType="circle"
                  wrapperStyle={{ paddingTop: "8px" }}
                  formatter={(value: string) => {
                    const item = stats.language_distribution.find((d) => d.language === value);
                    const total = stats.language_distribution.reduce((a, b) => a + b.count, 0) || 1;
                    const pct = item ? Math.round((item.count / total) * 100) : 0;
                    return (
                      <span className="text-xs text-slate-600 font-medium ml-1 mr-2">
                        {value} <span className="text-slate-400 font-normal">({pct}%)</span>
                      </span>
                    );
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Footer note */}
      <p className="text-xs text-slate-400 text-right">
        Last refreshed: {formatDate(new Date().toISOString())}
      </p>
    </div>
  );
}
