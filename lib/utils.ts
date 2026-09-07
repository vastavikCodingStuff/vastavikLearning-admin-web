import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

export function formatDate(iso: string): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}m ${s}s`;
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export function completionColor(percent: number): string {
  if (percent >= 80) return "text-green-500";
  if (percent >= 40) return "text-yellow-500";
  return "text-red-500";
}

export function languageColor(lang: string): string {
  const colors: Record<string, string> = {
    java: "bg-orange-100 text-orange-800",
    python: "bg-blue-100 text-blue-800",
    javascript: "bg-yellow-100 text-yellow-800",
    sql: "bg-purple-100 text-purple-800",
    cpp: "bg-pink-100 text-pink-800",
    c: "bg-gray-100 text-gray-800",
  };
  return colors[lang.toLowerCase()] ?? "bg-gray-100 text-gray-700";
}

export function statusBadge(status: string): string {
  const map: Record<string, string> = {
    open: "bg-red-100 text-red-700",
    in_progress: "bg-yellow-100 text-yellow-700",
    resolved: "bg-green-100 text-green-700",
    wont_fix: "bg-gray-100 text-gray-500",
    success: "bg-green-100 text-green-700",
    failed: "bg-red-100 text-red-700",
    pending: "bg-yellow-100 text-yellow-700",
  };
  return map[status] ?? "bg-gray-100 text-gray-700";
}

export function truncate(str: string, len = 80): string {
  if (!str) return "";
  return str.length > len ? str.slice(0, len) + "…" : str;
}

export function extractYouTubeVideoId(urlOrId: string): string {
  if (!urlOrId) return "";
  const trimmed = urlOrId.trim();
  // 11-char direct ID
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return trimmed;
  }
  // Standard watch URL: youtube.com/watch?v=ID
  const watchMatch = trimmed.match(/[?&]v=([a-zA-Z0-9_-]{11})/);
  if (watchMatch) return watchMatch[1];
  // Short URL: youtu.be/ID
  const shortMatch = trimmed.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/);
  if (shortMatch) return shortMatch[1];
  // Shorts URL: youtube.com/shorts/ID
  const shortsMatch = trimmed.match(/youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/);
  if (shortsMatch) return shortsMatch[1];
  // Embed URL: youtube.com/embed/ID
  const embedMatch = trimmed.match(/youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/);
  if (embedMatch) return embedMatch[1];
  return "";
}

