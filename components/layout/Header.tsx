"use client";

import { Bell, Menu, Search } from "lucide-react";
import { usePathname } from "next/navigation";
import { useSidebarStore } from "@/store/sidebarStore";

const pageTitles: Record<string, string> = {
  "/dashboard": "Overview",
  "/dashboard/courses": "Courses",
  "/dashboard/videos": "Video Lectures",
  "/dashboard/practice/quiz": "Practice — Quiz",
  "/dashboard/practice/coding": "Practice — Coding Exercises",
  "/dashboard/practice/mcq": "Practice — MCQs",
  "/dashboard/practice/pyq": "Practice — Past Year Questions",
  "/dashboard/students": "Students",
  "/dashboard/ai-chats": "AI Chat Sessions",
  "/dashboard/code-usage": "Code Editor Usage",
  "/dashboard/notes": "Student Notes",
  "/dashboard/bug-reports": "Bug Reports",
  "/dashboard/completion": "Completion Rates",
  "/dashboard/system": "System & Controls",
};

export function Header() {
  const pathname = usePathname();
  const { toggle } = useSidebarStore();

  // Match dynamic routes like /dashboard/students/[id], matching most specific paths first
  let title = "Dashboard";
  const sortedEntries = Object.entries(pageTitles).sort((a, b) => b[0].length - a[0].length);
  for (const [path, label] of sortedEntries) {
    if (pathname === path || pathname.startsWith(path + "/")) {
      title = label;
      break;
    }
  }

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between flex-shrink-0 z-30">
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={toggle}
          aria-label="Open sidebar menu"
          className="lg:hidden p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500 flex-shrink-0"
        >
          <Menu className="w-5 h-5" />
        </button>
        <h1 className="text-base sm:text-lg font-semibold text-slate-800 truncate">{title}</h1>
      </div>

      <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search…"
            className="pl-9 pr-3 sm:pr-4 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400 w-32 sm:w-48 md:w-56 transition-all"
          />
        </div>
        <button
          aria-label="Notifications"
          className="relative w-9 h-9 rounded-lg border border-slate-200 flex items-center justify-center hover:bg-slate-50 transition-colors flex-shrink-0"
        >
          <Bell className="w-4 h-4 text-slate-500" />
        </button>
      </div>
    </header>
  );
}
