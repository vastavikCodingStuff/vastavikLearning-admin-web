"use client";

import { useEffect, useState, useCallback } from "react";
import { Video, Monitor, PenLine, Zap, Plus, Search, Clock, Crown, Play, Youtube, ExternalLink, Trash2, RotateCw } from "lucide-react";
import api from "@/lib/api";
import { VideoLesson, VideoType } from "@/types/api";
import { formatDuration, cn } from "@/lib/utils";
import { useCourses } from "@/hooks/useCourses";
import { UploadVideoModal } from "@/components/courses/UploadVideoModal";

const typeConfig: Record<VideoType, { label: string; icon: React.ElementType; color: string }> = {
  screen_recording: { label: "Screen Recording", icon: Monitor, color: "bg-blue-100 text-blue-700" },
  whiteboard: { label: "Whiteboard", icon: PenLine, color: "bg-purple-100 text-purple-700" },
  short: { label: "Short", icon: Zap, color: "bg-green-100 text-green-700" },
};

const ALL_TYPES: (VideoType | "all")[] = ["all", "screen_recording", "whiteboard", "short"];

const DEFAULT_VIDEOS: VideoLesson[] = [
  {
    id: "v1",
    title: "Introduction to OOP — Class & Objects",
    video_type: "screen_recording",
    youtube_url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    youtube_video_id: "dQw4w9WgXcQ",
    duration_sec: 1420,
    is_premium: false,
    description: "Learn the fundamentals of classes, objects, states, and behaviors in Java for ICSE.",
    whiteboard_image_url: "",
    code_sample: "",
    notes: "OOP Core Principles: Encapsulation, Inheritance, Polymorphism, Abstraction",
    order: 1,
  },
  {
    id: "v2",
    title: "Polymorphism Explained on Whiteboard",
    video_type: "whiteboard",
    youtube_url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    youtube_video_id: "dQw4w9WgXcQ",
    duration_sec: 870,
    is_premium: true,
    description: "Deep conceptual breakdown of compile-time vs runtime polymorphism with memory layout diagrams.",
    whiteboard_image_url: "",
    code_sample: "",
    notes: "Method overloading vs method overriding difference table",
    order: 2,
  },
  {
    id: "v3",
    title: "Java Arrays in 60 Seconds",
    video_type: "short",
    youtube_url: "https://www.youtube.com/shorts/dQw4w9WgXcQ",
    youtube_video_id: "dQw4w9WgXcQ",
    duration_sec: 60,
    is_premium: false,
    description: "Quick rapid-fire recap of single and 2D array declarations and indexing.",
    whiteboard_image_url: "",
    code_sample: "",
    notes: "Array indices are 0-based; array.length is a final field",
    order: 3,
  },
];

export default function VideosPage() {
  const [videos, setVideos] = useState<VideoLesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<VideoType | "all">("all");
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [previewVideo, setPreviewVideo] = useState<VideoLesson | null>(null);

  const { courses } = useCourses();

  const getCustomVideos = (): VideoLesson[] => {
    if (typeof window === "undefined") return [];
    try {
      const stored = localStorage.getItem("vastavik_custom_videos");
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  };

  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchVideos = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const r = await api.get<{ videos: VideoLesson[] }>("/admin/videos");
      const serverVideos = r.data.videos ?? [];
      const custom = getCustomVideos();
      const customOnly = custom.filter((cv) => !serverVideos.some((sv) => sv.id === cv.id));
      setVideos([...customOnly, ...serverVideos]);
    } catch {
      const custom = getCustomVideos();
      const customOnly = custom.filter((cv) => !DEFAULT_VIDEOS.some((dv) => dv.id === cv.id));
      setVideos([...customOnly, ...DEFAULT_VIDEOS]);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchVideos();
  }, [fetchVideos]);

  const handleVideoAdded = (newVideo: VideoLesson) => {
    setVideos((prev) => [newVideo, ...prev]);
  };

  const handleDeleteVideo = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to delete "${title}"?`)) return;
    setVideos((prev) => prev.filter((v) => v.id !== id));
    try {
      const custom = getCustomVideos();
      localStorage.setItem(
        "vastavik_custom_videos",
        JSON.stringify(custom.filter((v) => v.id !== id))
      );
    } catch (e) {
      console.warn("Could not remove video from localStorage", e);
    }
    try {
      await api.delete(`/admin/videos/${id}`);
    } catch (err) {
      console.error("Failed to delete video from backend:", err);
    }
  };

  const filtered = videos.filter((v) => {
    const matchesType = typeFilter === "all" || v.video_type === typeFilter;
    const matchesSearch =
      v.title.toLowerCase().includes(search.toLowerCase()) ||
      (v.description && v.description.toLowerCase().includes(search.toLowerCase()));
    return matchesType && matchesSearch;
  });

  return (
    <div className="space-y-5">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search videos…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full sm:w-60 pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400"
            />
          </div>
          {/* Type filter pills */}
          <div className="flex flex-wrap gap-1.5">
            {ALL_TYPES.map((t) => (
              <button
                key={t}
                onClick={() => setTypeFilter(t)}
                className={cn(
                  "px-3 py-1.5 rounded-full text-xs font-medium capitalize transition-colors border",
                  typeFilter === t
                    ? "bg-orange-500 text-white border-orange-500"
                    : "bg-white text-slate-500 border-slate-200 hover:border-orange-300"
                )}
              >
                {t === "all" ? "All Types" : t.replace("_", " ")}
              </button>
            ))}
          </div>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <button
            onClick={fetchVideos}
            disabled={isRefreshing}
            className="flex items-center justify-center gap-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
          >
            <RotateCw className={cn("w-4 h-4", isRefreshing && "animate-spin")} /> Refresh
          </button>
          <button
            onClick={() => setIsUploadOpen(true)}
            className="flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex-1 sm:flex-none shadow-sm"
          >
            <Youtube className="w-4 h-4" /> Upload Video Lecture
          </button>
        </div>
      </div>

      {/* Upload Modal */}
      <UploadVideoModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        courses={courses}
        onVideoAdded={handleVideoAdded}
      />

      {/* Video Preview Modal */}
      {previewVideo && previewVideo.youtube_video_id && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl border border-slate-800">
            <div className="px-5 py-3 border-b border-slate-800 flex items-center justify-between text-white">
              <div className="flex items-center gap-2 min-w-0">
                <Youtube className="w-5 h-5 text-red-500 flex-shrink-0" />
                <p className="font-semibold text-sm truncate">{previewVideo.title}</p>
              </div>
              <button
                onClick={() => setPreviewVideo(null)}
                className="text-slate-400 hover:text-white text-sm px-2 py-1 rounded-lg"
              >
                ✕ Close
              </button>
            </div>
            <div className="aspect-video bg-black">
              <iframe
                src={`https://www.youtube-nocookie.com/embed/${previewVideo.youtube_video_id}?autoplay=1`}
                title={previewVideo.title}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
            <div className="p-4 bg-slate-950 text-slate-300 text-xs flex items-center justify-between">
              <span>Duration: {formatDuration(previewVideo.duration_sec)}</span>
              <a
                href={previewVideo.youtube_url}
                target="_blank"
                rel="noreferrer"
                className="text-orange-400 hover:text-orange-300 flex items-center gap-1"
              >
                Open in YouTube <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="animate-spin w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <Video className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p>No videos found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((video) => {
            const type = typeConfig[video.video_type] ?? typeConfig.screen_recording;
            const hasThumbnail = Boolean(video.youtube_video_id);

            return (
              <div key={video.id} className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-md transition-shadow flex flex-col">
                {/* Thumbnail */}
                <div
                  onClick={() => video.youtube_video_id && setPreviewVideo(video)}
                  className="h-36 bg-slate-900 flex items-center justify-center relative cursor-pointer group overflow-hidden"
                >
                  {hasThumbnail ? (
                    <img
                      src={`https://img.youtube.com/vi/${video.youtube_video_id}/hqdefault.jpg`}
                      alt={video.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <type.icon className="w-10 h-10 text-slate-600" />
                  )}

                  {/* Play Overlay */}
                  <div className="absolute inset-0 bg-black/30 group-hover:bg-black/50 transition-colors flex items-center justify-center">
                    <div className="w-10 h-10 rounded-full bg-red-600/90 group-hover:bg-red-600 text-white flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform">
                      <Play className="w-4 h-4 fill-white ml-0.5" />
                    </div>
                  </div>

                  {video.is_premium && (
                    <div className="absolute top-2 right-2 flex items-center gap-1 bg-yellow-400 text-yellow-900 text-xs px-2 py-0.5 rounded-full font-medium shadow">
                      <Crown className="w-3 h-3" /> Pro
                    </div>
                  )}

                  <span className="absolute bottom-2 right-2 bg-black/80 text-white text-[10px] px-1.5 py-0.5 rounded font-mono">
                    {formatDuration(video.duration_sec)}
                  </span>
                </div>

                <div className="p-4 flex-1 flex flex-col justify-between">
                  <div>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${type.color}`}>
                      {type.label}
                    </span>
                    <h3 className="font-semibold text-slate-800 text-sm mt-2 mb-1 line-clamp-2">
                      {video.title}
                    </h3>
                    <p className="text-xs text-slate-400 line-clamp-2 mb-3">{video.description}</p>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-50">
                    <button
                      onClick={() => setPreviewVideo(video)}
                      className="text-xs text-orange-500 hover:text-orange-600 font-medium flex items-center gap-1"
                    >
                      <Play className="w-3 h-3" /> Play Lecture
                    </button>
                    <div className="flex items-center gap-2">
                      <a
                        href={video.youtube_url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-slate-400 hover:text-slate-600 flex items-center gap-0.5"
                      >
                        YouTube <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                      <button
                        onClick={() => handleDeleteVideo(video.id, video.title)}
                        className="p-1 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 transition-colors"
                        title="Delete video"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
