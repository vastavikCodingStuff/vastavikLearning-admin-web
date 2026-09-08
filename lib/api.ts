import CryptoJS from "crypto-js";
import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from "axios";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL || "https://vastaviklearning-backend-app.onrender.com";
const API_KEY_ID = process.env.NEXT_PUBLIC_API_KEY_ID ?? "vastavik_prod_v1";
const API_KEY_SECRET =
  process.env.NEXT_PUBLIC_API_KEY_SECRET ?? "super_secret_hmac_production_key_change_me_32char";

/**
 * Generates HMAC-SHA256 signature matching the Android AuthInterceptor.kt logic.
 * Signature = HMAC-SHA256(secret, timestamp + METHOD + path)
 */
function generateHmac(method: string, path: string): { timestamp: string; hmac: string } {
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const message = timestamp + method.toUpperCase() + path;
  const hmac = CryptoJS.HmacSHA256(message, API_KEY_SECRET).toString(CryptoJS.enc.Hex);
  return { timestamp, hmac };
}

function getStoredToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("vastavik_admin_token");
}

function getStoredRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("vastavik_admin_refresh");
}

function isAuthEndpoint(url: string | undefined): boolean {
  if (!url) return false;
  // The HMAC path used during refresh is exactly /api/v1/auth/refresh (no query string).
  return /\/auth\/(login|refresh|signup|oauth|device-verify)/.test(url);
}

const api: AxiosInstance = axios.create({
  baseURL: API_BASE,
  timeout: 15_000,
  headers: {
    "Content-Type": "application/json",
  },
});

// ── Request interceptor: sign every request ───────────────────────────────────
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  try {
    const method = config.method?.toUpperCase() ?? "GET";
    let path = config.url ?? "";
    if (path.startsWith("http://") || path.startsWith("https://")) {
      const parsed = new URL(path);
      // HMAC the pathname ONLY (no query string) — the backend's
      // verify_hmac_headers in app/core/security.py signs
      // `request.url.path` (no query string), so anything we sign with
      // `?foo=bar` will 401 and silently break every paginated/filtered
      // admin call. See lib/api.ts history for the post-mortem.
      path = parsed.pathname;
    } else {
      const qIdx = path.indexOf("?");
      if (qIdx >= 0) path = path.slice(0, qIdx);
      if (!path.startsWith("/")) path = "/" + path;
    }

    const { timestamp, hmac } = generateHmac(method, path);

    config.headers["x-api-key-id"] = API_KEY_ID;
    config.headers["x-api-key-secret"] = API_KEY_SECRET;
    config.headers["x-timestamp"] = timestamp;
    config.headers["x-hmac"] = hmac;

    const token = getStoredToken();
    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }
  } catch (err) {
    console.warn("HMAC calculation error in request interceptor:", err);
  }

  return config;
});

// ── Response interceptor: refresh-on-401, then sign-out only if refresh fails ─
//
// Important: a 401 used to clear the token and redirect to /login immediately,
// which kicked admins out as soon as the 15-min access token expired (no
// refresh was ever attempted). New behaviour:
//
//   1. If the failing call was an auth endpoint itself → return the error as-is
//      (login failures should not trigger a self-refresh).
//   2. If we have a refresh token, try POST /api/v1/auth/refresh exactly once.
//      On success, swap the stored access token and replay the original request.
//   3. Only when refresh itself fails do we clear tokens and redirect to /login.
let isRefreshing = false;
let refreshSubscribers: Array<(token: string) => void> = [];

function onRefreshed(newToken: string) {
  refreshSubscribers.forEach((cb) => cb(newToken));
  refreshSubscribers = [];
}

function addRefreshSubscriber(cb: (token: string) => void) {
  refreshSubscribers.push(cb);
}

async function performRefresh(): Promise<string | null> {
  const refresh = getStoredRefreshToken();
  if (!refresh) return null;
  try {
    const { timestamp, hmac } = generateHmac("POST", "/api/v1/auth/refresh");
    const resp = await axios.post(
      `${API_BASE}/api/v1/auth/refresh`,
      { refresh_token: refresh },
      {
        headers: {
          "Content-Type": "application/json",
          "x-api-key-id": API_KEY_ID,
          "x-api-key-secret": API_KEY_SECRET,
          "x-timestamp": timestamp,
          "x-hmac": hmac,
        },
        timeout: 15_000,
      }
    );
    const data = resp.data ?? {};
    if (data.access_token) {
      localStorage.setItem("vastavik_admin_token", data.access_token);
      if (data.refresh_token) {
        localStorage.setItem("vastavik_admin_refresh", data.refresh_token);
      }
      return data.access_token as string;
    }
    return null;
  } catch {
    return null;
  }
}

function clearLocalAuth() {
  if (typeof window === "undefined") return;
  localStorage.removeItem("vastavik_admin_token");
  localStorage.removeItem("vastavik_admin_refresh");
  localStorage.removeItem("vastavik_admin_user");
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined;
    const status = error.response?.status;

    // 1. Auth-endpoint failures: surface as-is (don't try to refresh off a bad login).
    if (status === 401 && originalRequest && isAuthEndpoint(originalRequest.url)) {
      return Promise.reject(error);
    }

    // 2. 401 on a regular request: try a single refresh + replay.
    if (
      status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      getStoredRefreshToken()
    ) {
      originalRequest._retry = true;

      if (!isRefreshing) {
        isRefreshing = true;
        const newToken = await performRefresh();
        isRefreshing = false;
        if (newToken) {
          onRefreshed(newToken);
          originalRequest.headers = originalRequest.headers ?? {};
          originalRequest.headers["Authorization"] = `Bearer ${newToken}`;
          return api(originalRequest);
        }
        // Refresh failed: fall through to sign-out.
        clearLocalAuth();
        if (typeof window !== "undefined" && !window.location.pathname.includes("/login")) {
          window.location.href = "/login";
        }
        return Promise.reject(error);
      }

      // Another request is already refreshing — queue and replay when it finishes.
      return new Promise((resolve, reject) => {
        addRefreshSubscriber((newToken) => {
          originalRequest.headers = originalRequest.headers ?? {};
          originalRequest.headers["Authorization"] = `Bearer ${newToken}`;
          resolve(api(originalRequest));
        });
        setTimeout(() => reject(error), 15_000);
      });
    }

    // 3. 401 with no refresh token: classic sign-out.
    if (status === 401) {
      clearLocalAuth();
      if (typeof window !== "undefined" && !window.location.pathname.includes("/login")) {
        window.location.href = "/login";
      }
    }

    return Promise.reject(error);
  }
);

export default api;
