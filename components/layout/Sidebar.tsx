"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  BookOpen,
  Video,
  ClipboardList,
  Users,
  MessageSquare,
  Code2,
  StickyNote,
  Bug,
  BarChart3,
  Settings,
  LogOut,
  ChevronDown,
  ChevronRight,
  GraduationCap,
  X,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useAuthStore } from "@/store/authStore";
import { useSidebarStore } from "@/store/sidebarStore";
import { cn } from "@/lib/utils";

const navItems = [
  {
    title: "Overview",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Courses",
    href: "/dashboard/courses",
    icon: BookOpen,
  },
  {
    title: "Video Lectures",
    href: "/dashboard/videos",
    icon: Video,
  },
  {
    title: "Practice",
    icon: ClipboardList,
    children: [
      { title: "Quiz", href: "/dashboard/practice/quiz" },
      { title: "Coding Exercises", href: "/dashboard/practice/coding" },
      { title: "MCQs", href: "/dashboard/practice/mcq" },
      { title: "Past Year Questions", href: "/dashboard/practice/pyq" },
    ],
  },
  {
    title: "Students",
    href: "/dashboard/students",
    icon: Users,
  },
  {
    title: "AI Chats",
    href: "/dashboard/ai-chats",
    icon: MessageSquare,
  },
  {
    title: "Code Usage",
    href: "/dashboard/code-usage",
    icon: Code2,
  },
  {
    title: "Student Notes",
    href: "/dashboard/notes",
    icon: StickyNote,
  },
  {
    title: "Bug Reports",
    href: "/dashboard/bug-reports",
    icon: Bug,
  },
  {
    title: "Completion Rates",
    href: "/dashboard/completion",
    icon: BarChart3,
  },
  {
    title: "Growth",
    href: "/dashboard/growth",
    icon: BarChart3,
  },
  {
    title: "System",
    href: "/dashboard/system",
    icon: Settings,
  },
];

function SidebarContent({
  onClose,
  isMobile = false,
}: {
  onClose?: () => void;
  isMobile?: boolean;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const [expandedGroups, setExpandedGroups] = useState<string[]>(["Practice"]);

  const toggleGroup = (title: string) => {
    setExpandedGroups((prev) =>
      prev.includes(title) ? prev.filter((t) => t !== title) : [...prev, title]
    );
  };

  const handleLogout = () => {
    if (onClose) onClose();
    logout();
    router.replace("/login");
  };

  return (
    <div className="flex flex-col h-full">
      {/* Logo & Mobile Close */}
      <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-orange-500 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md shadow-orange-500/20">
            <GraduationCap className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-white font-bold text-sm leading-tight">Vastavik</p>
            <p className="text-slate-400 text-xs">Admin Panel</p>
          </div>
        </div>

        {isMobile && onClose && (
          <button
            onClick={onClose}
            aria-label="Close sidebar"
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          if (item.children) {
            const isExpanded = expandedGroups.includes(item.title);
            const isActive = item.children.some((c) => pathname === c.href);
            return (
              <div key={item.title}>
                <button
                  onClick={() => toggleGroup(item.title)}
                  className={cn(
                    "w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors",
                    isActive
                      ? "bg-slate-800 text-white"
                      : "text-slate-400 hover:text-white hover:bg-slate-800"
                  )}
                >
                  <span className="flex items-center gap-3">
                    {item.icon && <item.icon className="w-4 h-4" />}
                    {item.title}
                  </span>
                  {isExpanded ? (
                    <ChevronDown className="w-3 h-3" />
                  ) : (
                    <ChevronRight className="w-3 h-3" />
                  )}
                </button>
                {isExpanded && (
                  <div className="mt-1 ml-7 space-y-1">
                    {item.children.map((child) => (
                      <Link
                        key={child.href}
                        href={child.href}
                        onClick={onClose}
                        className={cn(
                          "block px-3 py-1.5 rounded-lg text-xs transition-colors",
                          pathname === child.href
                            ? "bg-orange-500 text-white font-medium"
                            : "text-slate-400 hover:text-white hover:bg-slate-800"
                        )}
                      >
                        {child.title}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href!}
              onClick={onClose}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
                pathname === item.href
                  ? "bg-orange-500 text-white font-medium"
                  : "text-slate-400 hover:text-white hover:bg-slate-800"
              )}
            >
              {item.icon && <item.icon className="w-4 h-4" />}
              {item.title}
            </Link>
          );
        })}
      </nav>

      {/* User footer */}
      <div className="px-4 py-4 border-t border-slate-800">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
            {user?.name?.charAt(0)?.toUpperCase() ?? "A"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-xs font-medium truncate">{user?.name ?? "Admin"}</p>
            <p className="text-slate-500 text-xs truncate">{user?.email ?? ""}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-800 text-sm transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </div>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const { isOpen, close } = useSidebarStore();

  // Close mobile sidebar on route change
  useEffect(() => {
    close();
  }, [pathname, close]);

  // Prevent background body scroll when mobile drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  return (
    <>
      {/* Desktop Static Sidebar */}
      <aside className="hidden lg:flex w-64 min-h-screen bg-slate-900 flex-col flex-shrink-0 sticky top-0 h-screen">
        <SidebarContent />
      </aside>

      {/* Mobile Slide-Over Drawer & Backdrop */}
      {isOpen && (
        <div
          onClick={close}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden transition-opacity"
          aria-hidden="true"
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] bg-slate-900 flex flex-col shadow-2xl transition-transform duration-300 ease-in-out lg:hidden",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <SidebarContent onClose={close} isMobile />
      </aside>
    </>
  );
}
