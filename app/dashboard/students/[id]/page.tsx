"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useStudent } from "@/hooks/useStudents";
import {
  Crown,
  BookOpen,
  Flame,
  Code2,
  CreditCard,
  ChevronLeft,
  Calendar,
  Globe,
  Activity,
  Search,
  MessageSquare,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Clock,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Terminal,
  AlertTriangle,
} from "lucide-react";
import Link from "next/link";
import { formatDate, languageColor, statusBadge } from "@/lib/utils";
import { StudentActivity, StudentPracticeAttempt, StudentSearchItem, AIChatSession } from "@/types/api";

export default function StudentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: student, loading, error } = useStudent(id);

  type TabKey = "overview" | "activity" | "searches" | "ai-chats" | "practice" | "code-runs";
  const [activeTab, setActiveTab] = useState<TabKey>("overview");
  const [expandedActivityId, setExpandedActivityId] = useState<string | null>(null);
  const [expandedChatSessionId, setExpandedChatSessionId] = useState<string | null>(null);
  const [practiceFilter, setPracticeFilter] = useState<"all" | "mcq" | "predict_output" | "coding">("all");

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full" />
    </div>
  );
  if (error) return <p className="text-red-500">{error}</p>;
  if (!student) return null;

  const activities: StudentActivity[] = student.activities ?? [];
  const searches: StudentSearchItem[] = student.searches ?? [];
  const practiceItems: StudentPracticeAttempt[] = student.practice_history ?? [];
  const aiChats: AIChatSession[] = student.ai_chats ?? [];
  const codeExecs = student.code_executions ?? [];

  const filteredPractice = practiceItems.filter((p) => {
    if (practiceFilter === "all") return true;
    return p.type === practiceFilter;
  });

  return (
    <div className="max-w-5xl space-y-6">
      {/* Breadcrumb */}
      <Link href="/dashboard/students" className="flex items-center gap-1 text-sm text-slate-500 hover:text-orange-500 transition-colors">
        <ChevronLeft className="w-4 h-4" /> Back to Students
      </Link>

      {/* Profile card */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-5">
          <div className="w-14 h-14 sm:w-16 sm:h-16 bg-orange-100 rounded-2xl flex items-center justify-center text-orange-600 text-xl sm:text-2xl font-bold flex-shrink-0">
            {student.name.charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h2 className="text-xl sm:text-2xl font-bold text-slate-800">{student.name}</h2>
              {student.is_premium && (
                <span className="flex items-center gap-1 text-xs bg-yellow-100 text-yellow-700 px-2.5 py-1 rounded-full font-semibold">
                  <Crown className="w-3.5 h-3.5" /> Pro Member
                </span>
              )}
            </div>
            <p className="text-slate-500 text-sm mt-0.5 break-all sm:break-normal">
              {student.school ? `${student.school} · ` : ""}{student.email}
              <span className="text-xs text-slate-400 ml-2 font-mono">UID: {student.uid}</span>
            </p>
            <div className="flex flex-wrap gap-2 mt-3">
              {student.enrolled_course && (
                <span className="text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-1 rounded-full font-medium">
                  Enrolled: {student.enrolled_course}
                </span>
              )}
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
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        {[
          { icon: Flame, label: "Streak", value: `${student.streak_count} days`, color: "text-orange-500" },
          { icon: BookOpen, label: "Lessons Done", value: student.lessons_completed.toString(), color: "text-blue-500" },
          { icon: Activity, label: "Total Activities", value: activities.length.toString(), color: "text-emerald-500" },
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

      {/* Navigation Tabs */}
      <div className="border-b border-slate-200">
        <nav className="flex space-x-2 sm:space-x-4 overflow-x-auto pb-1" aria-label="Tabs">
          {[
            { key: "overview", label: "Overview", icon: BookOpen, count: null },
            { key: "activity", label: "Activity Timeline", icon: Activity, count: activities.length },
            { key: "searches", label: "Searches", icon: Search, count: searches.length },
            { key: "ai-chats", label: "AI Chats", icon: MessageSquare, count: aiChats.length },
            { key: "practice", label: "Practice History", icon: HelpCircle, count: practiceItems.length },
            { key: "code-runs", label: "Code Runs", icon: Terminal, count: codeExecs.length },
          ].map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as TabKey)}
                className={`flex items-center gap-1.5 py-2.5 px-3 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                  isActive
                    ? "bg-orange-500 text-white shadow-sm"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                }`}
              >
                <tab.icon className="w-4 h-4" />
                <span>{tab.label}</span>
                {tab.count !== null && (
                  <span
                    className={`ml-1 text-xs px-1.5 py-0.5 rounded-full ${
                      isActive ? "bg-orange-600 text-white" : "bg-slate-200 text-slate-700"
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === "overview" && (
        <div className="space-y-5">
          {/* Quick links */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5">
            <h3 className="font-semibold text-slate-800 text-sm mb-3">Quick Navigation</h3>
            <div className="flex flex-wrap gap-3">
              {[
                { href: `/dashboard/ai-chats?uid=${student.uid}`, label: "Inspect All AI Chats", icon: "💬" },
                { href: `/dashboard/code-usage?uid=${student.uid}`, label: "Code Usage Telemetry", icon: "💻" },
                { href: `/dashboard/notes?uid=${student.uid}`, label: "Student Notes", icon: "📝" },
                { href: `/dashboard/completion?uid=${student.uid}`, label: "Completion Analytics", icon: "📊" },
              ].map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-sm text-slate-700 hover:bg-orange-50 hover:border-orange-300 hover:text-orange-600 transition-colors"
                >
                  <span>{link.icon}</span>
                  <span>{link.label}</span>
                </Link>
              ))}
            </div>
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
        </div>
      )}

      {/* TAB 2: ACTIVITY TIMELINE */}
      {activeTab === "activity" && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="font-semibold text-slate-800 text-base flex items-center gap-2">
              <Activity className="w-4 h-4 text-orange-500" />
              Live Activity Stream ({activities.length})
            </h3>
            <span className="text-xs text-slate-400">Chronological telemetry</span>
          </div>

          {activities.length === 0 ? (
            <p className="text-sm text-slate-400 py-8 text-center">No recorded activity for this student yet.</p>
          ) : (
            <div className="relative border-l-2 border-slate-200 ml-3 space-y-4 py-2">
              {activities.map((act) => {
                const isExpanded = expandedActivityId === act.id;
                const eventColor = act.event.includes("SEARCH")
                  ? "bg-blue-500"
                  : act.event.includes("AI_CHAT")
                  ? "bg-purple-500"
                  : act.event.includes("PREDICT")
                  ? "bg-amber-500"
                  : act.event.includes("MCQ")
                  ? "bg-emerald-500"
                  : "bg-slate-500";

                return (
                  <div key={act.id} className="relative pl-6">
                    <div className={`absolute -left-[9px] top-1 w-4 h-4 rounded-full ${eventColor} border-2 border-white`} />
                    <div className="bg-slate-50 border border-slate-200 rounded-lg p-3.5 space-y-2">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs px-2 py-0.5 rounded font-bold bg-white text-slate-800 border border-slate-200">
                            {act.event}
                          </span>
                          {act.metadata?.verdict && (
                            <span
                              className={`text-xs px-2 py-0.5 rounded font-semibold ${
                                act.metadata.verdict === "CORRECT" || act.metadata.verdict === "SOLVED"
                                  ? "bg-emerald-100 text-emerald-800"
                                  : "bg-red-100 text-red-800"
                              }`}
                            >
                              {act.metadata.verdict}
                            </span>
                          )}
                          {act.metadata?.language && (
                            <span className="text-xs px-1.5 py-0.5 bg-slate-200 text-slate-700 rounded">
                              {act.metadata.language}
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-slate-400 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatDate(act.timestamp || act.received_at || "")}
                        </span>
                      </div>

                      {act.query && (
                        <p className="text-sm font-medium text-slate-800 break-words">
                          <span className="text-slate-400 text-xs font-normal">Query/Prompt: </span>
                          {act.query}
                        </p>
                      )}

                      {act.response && (
                        <div>
                          <button
                            onClick={() => setExpandedActivityId(isExpanded ? null : act.id)}
                            className="text-xs text-orange-600 hover:text-orange-700 flex items-center gap-1 font-medium mt-1"
                          >
                            {isExpanded ? "Hide Response" : "View Response"}
                            {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                          </button>
                          {isExpanded && (
                            <div className="mt-2 p-3 bg-white rounded border border-slate-200 text-xs text-slate-700 font-mono whitespace-pre-wrap max-h-60 overflow-y-auto">
                              {act.response}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: SEARCHES */}
      {activeTab === "searches" && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="font-semibold text-slate-800 text-base flex items-center gap-2">
              <Search className="w-4 h-4 text-blue-500" />
              Search Queries ({searches.length})
            </h3>
            <span className="text-xs text-slate-400">Database Search Audit</span>
          </div>

          {searches.length === 0 ? (
            <p className="text-sm text-slate-400 py-8 text-center">No searches logged for this student yet.</p>
          ) : (
            <div className="divide-y divide-slate-100">
              {searches.map((s) => (
                <div key={s.id} className="py-3 flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                      <span>"{s.query}"</span>
                      {s.is_flagged && (
                        <span className="text-xs bg-red-100 text-red-700 border border-red-200 px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" /> Flagged
                        </span>
                      )}
                    </p>
                    {s.flag_reasons && s.flag_reasons.length > 0 && (
                      <p className="text-xs text-red-600">Reasons: {s.flag_reasons.join(", ")}</p>
                    )}
                  </div>
                  <span className="text-xs text-slate-400 whitespace-nowrap">{formatDate(s.created_at)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: AI CHATS */}
      {activeTab === "ai-chats" && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="font-semibold text-slate-800 text-base flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-purple-500" />
              AI Chat Sessions ({aiChats.length})
            </h3>
            <Link
              href={`/dashboard/ai-chats?uid=${student.uid}`}
              className="text-xs text-orange-600 hover:text-orange-700 font-medium"
            >
              Open in AI Chats Manager →
            </Link>
          </div>

          {aiChats.length === 0 ? (
            <p className="text-sm text-slate-400 py-8 text-center">No AI chat sessions found for this student.</p>
          ) : (
            <div className="space-y-3">
              {aiChats.map((chat) => {
                const isExpanded = expandedChatSessionId === chat.session_id;
                const msgs = chat.messages || [];

                return (
                  <div key={chat.session_id} className="border border-slate-200 rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-purple-500" />
                        <h4 className="font-semibold text-slate-800 text-sm">{chat.title || "AI Chat Session"}</h4>
                        <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                          {chat.model_used || "Mistral"}
                        </span>
                        {chat.is_flagged && (
                          <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded font-medium">
                            Flagged
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-slate-400">{formatDate(chat.updated_at || chat.created_at)}</span>
                        <button
                          onClick={() => setExpandedChatSessionId(isExpanded ? null : chat.session_id)}
                          className="text-xs font-semibold text-orange-600 hover:text-orange-700"
                        >
                          {isExpanded ? "Collapse" : `View Messages (${msgs.length})`}
                        </button>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="pt-3 border-t border-slate-100 space-y-3 max-h-96 overflow-y-auto">
                        {msgs.map((m: any, idx: number) => (
                          <div
                            key={idx}
                            className={`p-3 rounded-lg text-sm ${
                              m.role === "user"
                                ? "bg-blue-50 border border-blue-100 ml-4"
                                : "bg-slate-50 border border-slate-200 mr-4"
                            }`}
                          >
                            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                              <span className="font-semibold uppercase text-slate-600">{m.role}</span>
                              {m.timestamp && <span>{formatDate(m.timestamp)}</span>}
                            </div>
                            <p className="whitespace-pre-wrap text-slate-800 font-sans">{m.content}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 5: PRACTICE HISTORY */}
      {activeTab === "practice" && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5 space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-3 pb-3 border-b border-slate-100">
            <h3 className="font-semibold text-slate-800 text-base flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-emerald-500" />
              Practice Submissions & AI Trace ({filteredPractice.length})
            </h3>

            {/* Filter buttons */}
            <div className="flex items-center gap-1.5">
              {[
                { id: "all", label: "All" },
                { id: "mcq", label: "MCQs" },
                { id: "predict_output", label: "Predict Output" },
                { id: "coding", label: "Coding" },
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => setPracticeFilter(f.id as any)}
                  className={`text-xs px-2.5 py-1 rounded-full font-medium transition-colors ${
                    practiceFilter === f.id
                      ? "bg-emerald-600 text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {filteredPractice.length === 0 ? (
            <p className="text-sm text-slate-400 py-8 text-center">No practice attempts found for this category.</p>
          ) : (
            <div className="space-y-4">
              {filteredPractice.map((p) => {
                const isCorrect = p.is_correct === true || p.verdict === "CORRECT" || p.verdict === "SOLVED";

                return (
                  <div key={p.id} className="border border-slate-200 rounded-lg p-4 space-y-3">
                    {/* Header */}
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs uppercase font-bold px-2 py-0.5 bg-slate-100 text-slate-700 rounded border border-slate-200">
                          {p.type.replace("_", " ")}
                        </span>
                        {p.topic && <span className="text-xs font-semibold text-slate-700">{p.topic}</span>}
                        {p.language && (
                          <span className="text-xs px-2 py-0.5 bg-blue-50 text-blue-700 rounded font-medium">
                            {p.language}
                          </span>
                        )}
                        <span
                          className={`text-xs px-2 py-0.5 rounded font-bold flex items-center gap-1 ${
                            isCorrect ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800"
                          }`}
                        >
                          {isCorrect ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                          {p.verdict || (isCorrect ? "CORRECT" : "INCORRECT")}
                        </span>
                      </div>
                      <span className="text-xs text-slate-400">{formatDate(p.created_at)}</span>
                    </div>

                    {/* Question / Title */}
                    {(p.question || p.problem_title) && (
                      <p className="text-sm font-semibold text-slate-800">{p.question || p.problem_title}</p>
                    )}

                    {/* Code Snippet for Predict the Output */}
                    {p.code_snippet && (
                      <div className="bg-slate-900 text-slate-100 rounded-lg p-3 font-mono text-xs overflow-x-auto">
                        <pre>{p.code_snippet}</pre>
                      </div>
                    )}

                    {/* Predictions vs Actuals */}
                    {p.type === "predict_output" && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs">
                        <div>
                          <span className="text-slate-400 font-semibold uppercase">Student's Output:</span>
                          <p className="font-mono text-slate-800 mt-0.5 font-bold">{p.predicted_output || "—"}</p>
                        </div>
                        <div>
                          <span className="text-slate-400 font-semibold uppercase">Actual Console Output:</span>
                          <p className="font-mono text-slate-800 mt-0.5 font-bold">{p.actual_output || "—"}</p>
                        </div>
                      </div>
                    )}

                    {/* MCQ Options selection */}
                    {p.type === "mcq" && p.options && p.options.length > 0 && (
                      <div className="space-y-1.5 text-xs bg-slate-50 p-3 rounded-lg border border-slate-200">
                        <p className="text-slate-500 font-semibold">Options:</p>
                        {p.options.map((opt, idx) => {
                          const isStudentChoice = String(p.selected_option) === String(idx) || p.selected_option === opt;
                          const isAnswer = String(p.correct_option) === String(idx) || p.correct_option === opt;

                          return (
                            <div
                              key={idx}
                              className={`p-2 rounded border flex items-center justify-between ${
                                isAnswer
                                  ? "bg-emerald-50 border-emerald-300 font-bold text-emerald-900"
                                  : isStudentChoice
                                  ? "bg-red-50 border-red-300 text-red-900 font-medium"
                                  : "bg-white border-slate-200 text-slate-700"
                              }`}
                            >
                              <span>
                                {idx + 1}. {opt}
                              </span>
                              {isStudentChoice && isAnswer && (
                                <span className="text-emerald-700 font-bold text-[10px]">Student Answer (Correct)</span>
                              )}
                              {isStudentChoice && !isAnswer && (
                                <span className="text-red-700 font-bold text-[10px]">Student Answer (Incorrect)</span>
                              )}
                              {!isStudentChoice && isAnswer && (
                                <span className="text-emerald-700 font-bold text-[10px]">Correct Answer</span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Coding Solution Code */}
                    {p.solution_code && (
                      <div className="space-y-1">
                        <p className="text-xs text-slate-500 font-semibold">AI Solution Code:</p>
                        <div className="bg-slate-900 text-slate-100 rounded-lg p-3 font-mono text-xs overflow-x-auto max-h-56">
                          <pre>{p.solution_code}</pre>
                        </div>
                      </div>
                    )}

                    {/* Explanation / Trace */}
                    {p.explanation && (
                      <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 text-xs text-orange-900">
                        <span className="font-bold">AI Explanation & Trace: </span>
                        <span className="whitespace-pre-wrap">{p.explanation}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 6: CODE RUNS */}
      {activeTab === "code-runs" && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="font-semibold text-slate-800 text-base flex items-center gap-2">
              <Terminal className="w-4 h-4 text-emerald-500" />
              Judge0 Code Executions ({codeExecs.length})
            </h3>
            <span className="text-xs text-slate-400">Compiler Telemetry</span>
          </div>

          {codeExecs.length === 0 ? (
            <p className="text-sm text-slate-400 py-8 text-center">No code executions recorded for this student.</p>
          ) : (
            <div className="space-y-3">
              {codeExecs.map((exec) => (
                <div key={exec.id} className="border border-slate-200 rounded-lg p-3.5 space-y-2">
                  <div className="flex items-center justify-between flex-wrap gap-2 text-xs">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded font-bold ${languageColor(exec.language)}`}>
                        {exec.language.toUpperCase()}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded font-semibold ${
                          exec.status_description?.toLowerCase().includes("accepted")
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {exec.status_description || "Executed"}
                      </span>
                    </div>
                    <span className="text-slate-400">{formatDate(exec.created_at)}</span>
                  </div>

                  {exec.source_code && (
                    <div className="bg-slate-900 text-slate-100 rounded p-3 font-mono text-xs overflow-x-auto max-h-40">
                      <pre>{exec.source_code}</pre>
                    </div>
                  )}

                  {(exec.stdout || exec.stderr) && (
                    <div className="text-xs font-mono bg-slate-50 border border-slate-200 p-2.5 rounded space-y-1">
                      {exec.stdout && (
                        <div>
                          <span className="text-slate-400 font-bold uppercase">Output: </span>
                          <span className="text-slate-800">{exec.stdout}</span>
                        </div>
                      )}
                      {exec.stderr && (
                        <div>
                          <span className="text-red-500 font-bold uppercase">Error: </span>
                          <span className="text-red-700">{exec.stderr}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
