import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { AdminUser, AuthResponse } from "@/types/api";

interface AuthState {
  token: string | null;
  refreshToken: string | null;
  user: AdminUser | null;
  isLoggedIn: boolean;
  isHydrated: boolean;
  login: (data: AuthResponse) => void;
  logout: () => void;
  setHydrated: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      refreshToken: null,
      user: null,
      isLoggedIn: false,
      isHydrated: false,

      login: (data: AuthResponse) => {
        if (typeof window !== "undefined") {
          localStorage.setItem("vastavik_admin_token", data.access_token);
          localStorage.setItem("vastavik_admin_refresh", data.refresh_token);
          localStorage.setItem(
            "vastavik_admin_user",
            JSON.stringify({
              user_id: data.user_id,
              name: data.name,
              email: data.email,
              role: data.role as "admin",
            })
          );
        }
        set({
          token: data.access_token,
          refreshToken: data.refresh_token,
          user: {
            user_id: data.user_id,
            name: data.name,
            email: data.email,
            role: data.role as "admin",
          },
          isLoggedIn: true,
          isHydrated: true,
        });
      },

      logout: () => {
        if (typeof window !== "undefined") {
          localStorage.removeItem("vastavik_admin_token");
          localStorage.removeItem("vastavik_admin_refresh");
          localStorage.removeItem("vastavik_admin_user");
        }
        set({
          token: null,
          refreshToken: null,
          user: null,
          isLoggedIn: false,
        });
      },

      setHydrated: () => set({ isHydrated: true }),
    }),
    {
      name: "vastavik_admin_auth",
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated();
      },
    }
  )
);
