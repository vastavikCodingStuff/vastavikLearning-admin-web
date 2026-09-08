"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { saveAuth } from "@/lib/auth";
import { AuthResponse } from "@/types/api";

const DEFAULT_ADMIN_EMAIL = "admin@vastaviklearning.com";
const DEFAULT_ADMIN_PASS = "change_this_admin_password_123!";

export default function LoginPage() {
  const router = useRouter();
  const login = useAuthStore((s) => s.login);

  // Controlled input state with pre-filled default admin credentials
  const [email, setEmail] = useState(DEFAULT_ADMIN_EMAIL);
  const [password, setPassword] = useState(DEFAULT_ADMIN_PASS);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const performLogin = (authData: AuthResponse) => {
    saveAuth(authData);
    login(authData);
    router.push("/dashboard");
  };

  const handleSignIn = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!email || !password) {
      setError("Please enter both email and password.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // 1. Attempt API call to backend
      const res = await api.post<AuthResponse>("/api/v1/auth/login", {
        email: email.trim(),
        password: password,
      });

      if (res.data.role !== "admin") {
        setError("Access denied. This account does not have admin permissions.");
        setLoading(false);
        return;
      }

      performLogin(res.data);
    } catch (err: unknown) {
      // Surface the real error from the backend. No more silent fake-token
      // fallback: previously, a network blip would sign the user in with a
      // bogus local token that the backend immediately rejected, causing the
      // axios interceptor to redirect back to /login and feel like a
      // mysterious auto-signout.
      const axiosErr = err as {
        response?: { data?: { detail?: string; message?: string } };
      };
      const msg =
        axiosErr.response?.data?.detail ??
        axiosErr.response?.data?.message ??
        "Could not reach the server. Check your connection and try again.";
      setError(msg);
      setLoading(false);
    }
  };

  // "One-click sign in" is now an actual backend call with the default master
  // admin credentials, not a local token mint. It only works if the backend
  // is reachable AND the master admin password still matches (which it does
  // for this deployment per config.ADMIN_PASSWORD).
  const handleInstantGuestLogin = async () => {
    setEmail(DEFAULT_ADMIN_EMAIL);
    setPassword(DEFAULT_ADMIN_PASS);
    setLoading(true);
    setError(null);
    try {
      const res = await api.post<AuthResponse>("/api/v1/auth/login", {
        email: DEFAULT_ADMIN_EMAIL,
        password: DEFAULT_ADMIN_PASS,
      });
      if (res.data.role !== "admin") {
        setError("Master admin credentials are no longer valid.");
        setLoading(false);
        return;
      }
      performLogin(res.data);
    } catch (err: unknown) {
      const axiosErr = err as {
        response?: { data?: { detail?: string; message?: string } };
      };
      const msg =
        axiosErr.response?.data?.detail ??
        axiosErr.response?.data?.message ??
        "Could not reach the server. Check your connection and try again.";
      setError(msg);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-orange-500 mb-4 shadow-xl shadow-orange-500/30">
            <span className="text-white text-2xl font-black">V</span>
          </div>
          <h1 className="text-white text-2xl font-bold tracking-tight">Vastavik Learning</h1>
          <p className="text-slate-400 text-sm mt-1">Administrator Portal</p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-2xl p-8 shadow-2xl border border-slate-100">
          <h2 className="text-xl font-bold text-slate-800 mb-1">Sign in to your account</h2>
          <p className="text-xs text-slate-500 mb-6">Enter your administrator credentials below</p>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 mb-5 text-sm flex items-start gap-2">
              <span className="font-bold">⚠️</span>
              <p className="flex-1">{error}</p>
            </div>
          )}

          <form onSubmit={handleSignIn} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                Admin Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@vastaviklearning.com"
                required
                className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-slate-800 font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                required
                className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-slate-800 font-medium"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-orange-500 hover:bg-orange-600 active:scale-[0.99] disabled:bg-orange-300 text-white font-semibold py-3 rounded-xl transition-all text-sm shadow-lg shadow-orange-500/25 mt-2"
            >
              {loading ? "Verifying..." : "Sign In"}
            </button>
          </form>

          {/* Quick 1-Click Access for development */}
          <div className="mt-6 pt-5 border-t border-slate-100 text-center">
            <button
              type="button"
              onClick={handleInstantGuestLogin}
              disabled={loading}
              className="w-full bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 font-medium py-2.5 rounded-xl text-xs transition-colors disabled:opacity-60"
            >
              🚀 Instant One-Click Admin Sign In
            </button>
          </div>
        </div>

        <p className="text-center text-xs text-slate-500 mt-6">
          Vastavik Learning Admin Dashboard &copy; {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
}
