"use client";

import { useParams } from "next/navigation";
import { useStudent } from "@/hooks/useStudents";
import { Crown, BookOpen, Flame, Code2, CreditCard, ChevronLeft, Calendar, Globe } from "lucide-react";
import Link from "next/link";
import { formatDate, languageColor, statusBadge } from "@/lib/utils";

export default function StudentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: student, loading, error } = useStudent(id);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full" />
    </div>
  );
  if (error) return <p className="text-red-500">{error}</p>;
  if (!student) return null;

  return (
    <div className="max-w-4xl space-y-5">
      {/* Breadcrumb */}
      <Link href="/dashboard/students" className="flex items-center gap-1 text-sm text-slate-500 hover:text-orange-500 transition-colors">
        <ChevronLeft className="w-4 h-4" /> Back to Students
      </Link>

      {/* Profile card */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-5">
          <div className="w-14 h-14 sm:w-16 sm:h-16 bg-orange-100 rounded-2xl flex items-center justify-center text-orange-600 text-xl sm:text-2xl font-bold flex-shrink-0">
            {student.name.charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h2 className="text-lg sm:text-xl font-bold text-slate-800">{student.name}</h2>
              {student.is_premium && (
                <span className="flex items-center gap-1 text-xs bg-yellow-100 text-yellow-700 px-2.5 py-1 rounded-full font-semibold">
                  <Crown className="w-3.5 h-3.5" /> Pro Member
                </span>
              )}
            </div>
            <p className="text-slate-500 text-sm mt-0.5 break-all sm:break-normal">{student.email}</p>
            <div className="flex flex-wrap gap-2 mt-3">
              <span className="text-xs bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full">
                {student.board}
              </span>
              {student.class_grade && (
                <span className="text-xs bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full">
                  Class {student.class_grade}
                </span>
              )}
              <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${languageColor(student.preferred_language)}`}>
                {student.preferred_language}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        {[
          { icon: Flame, label: "Streak", value: `${student.streak_count} days`, color: "text-orange-500" },
          { icon: BookOpen, label: "Lessons Done", value: student.lessons_completed.toString(), color: "text-blue-500" },
          { icon: Calendar, label: "Joined", value: formatDate(student.created_at), color: "text-slate-500" },
          {
            icon: Globe,
            label: "Subscription",
            value: student.is_premium
              ? `Expires ${formatDate(student.subscription_expires_at!)}`
              : "Free Plan",
            color: student.is_premium ? "text-yellow-600" : "text-slate-400",
          },
        ].map((stat) => (
          <div key={stat.label} className="bg-white rounded-xl p-4 shadow-sm border border-slate-100">
            <stat.icon className={`w-5 h-5 mb-2 ${stat.color}`} />
            <p className="text-xs text-slate-400">{stat.label}</p>
            <p className="font-semibold text-slate-800 text-sm mt-0.5">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Payment history */}
      {student.payment_details && student.payment_details.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-100">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-slate-400" />
            <h3 className="font-semibold text-slate-800 text-sm">Payment History</h3>
          </div>
          <div className="divide-y divide-slate-50">
            {student.payment_details.map((p) => (
              <div key={p.order_id} className="px-5 py-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-700">{p.plan_id}</p>
                  <p className="text-xs text-slate-400">{formatDate(p.timestamp)} · {p.order_id}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-slate-800">₹{p.amount}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusBadge(p.status)}`}>
                    {p.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick links */}
      <div className="flex flex-wrap gap-3">
        {[
          { href: `/dashboard/ai-chats?uid=${student.uid}`, label: "View AI Chats", icon: "💬" },
          { href: `/dashboard/code-usage?uid=${student.uid}`, label: "Code Usage", icon: "💻" },
          { href: `/dashboard/notes?uid=${student.uid}`, label: "Student Notes", icon: "📝" },
          { href: `/dashboard/completion?uid=${student.uid}`, label: "Completion", icon: "📊" },
        ].map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-4 py-2 text-sm text-slate-600 hover:bg-orange-50 hover:border-orange-300 hover:text-orange-600 transition-colors"
          >
            {link.icon} {link.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
