"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { useAuthStore } from "@/store/authStore";
import { getToken, getAdminUser } from "@/lib/auth";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isLoggedIn, user, isHydrated } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();
  const [isClient, setIsClient] = useState(false);
  // Re-evaluated on every render against actual localStorage so a stale
  // zustand state (e.g. after a hard reload mid-session) can never let a
  // logged-out user linger on a dashboard page.
  const localToken = isClient ? getToken() : null;
  const localUser = isClient ? getAdminUser() : null;
  const hasAuth = (isLoggedIn && user?.role === "admin") || (!!localToken && localUser?.role === "admin");

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient) return;
    if (!hasAuth) {
      router.replace("/login");
    }
  }, [isClient, isHydrated, isLoggedIn, user, hasAuth, router, pathname]);

  if (!isClient || !hasAuth) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header />
        <main className="flex-1 p-3 sm:p-5 md:p-6 overflow-x-hidden overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
