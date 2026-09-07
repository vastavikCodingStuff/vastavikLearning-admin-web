import CryptoJS from "crypto-js";
import axios, { AxiosInstance, InternalAxiosRequestConfig } from "axios";

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

const api: AxiosInstance = axios.create({
  baseURL: API_BASE,
  timeout: 10_000,
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
      path = parsed.pathname + (parsed.search || "");
    } else if (!path.startsWith("/")) {
      path = "/" + path;
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

// ── Response interceptor: global 401 → redirect to login ─────────────────────
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Only redirect if not already on the login page
    if (
      error.response?.status === 401 &&
      typeof window !== "undefined" &&
      !window.location.pathname.includes("/login")
    ) {
      localStorage.removeItem("vastavik_admin_token");
      localStorage.removeItem("vastavik_admin_user");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default api;
