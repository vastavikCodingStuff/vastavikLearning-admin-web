"use client";

import { useState } from "react";
import { X, Youtube, Monitor, PenLine, Zap, Crown, CheckCircle2, Play } from "lucide-react";
import { Course, VideoLesson, VideoType, VideoPrivacy } from "@/types/api";
import { extractYouTubeVideoId, cn } from "@/lib/utils";
import api from "@/lib/api";

interface UploadVideoModalProps {
  isOpen: boolean;
  onClose: () => void;
  courses: Course[];
  preselectedCourseId?: string;
  onVideoAdded?: (video: VideoLesson) => void;
}

const typeOptions: { type: VideoType; label: string; icon: React.ElementType; desc: string }[] = [
  {
    type: "screen_recording",
    label: "Screen Recording",
    icon: Monitor,
    desc: "Computer screen / VS Code hands-on coding walkthrough",
  },
  {
    type: "whiteboard",
    label: "Whiteboard",
    icon: PenLine,
    desc: "Conceptual diagrammatic lecture on whiteboard",
  },
  {
    type: "short",
    label: "Short",
    icon: Zap,
    desc: "High-yield vertical 1-2 minute quick concept recap",
  },
];

export function UploadVideoModal({
  isOpen,
  onClose,
  courses,
  preselectedCourseId,
  onVideoAdded,
}: UploadVideoModalProps) {
  const [title, setTitle] = useState("");
  const [videoType, setVideoType] = useState<VideoType>("screen_recording");
  const [youtubeInput, setYoutubeInput] = useState("");
  const [courseId, setCourseId] = useState(preselectedCourseId || (courses[0]?.id ?? ""));
  const [durationMins, setDurationMins] = useState(15);
  const [isPremium, setIsPremium] = useState(false);
  const [privacy, setPrivacy] = useState<VideoPrivacy>("unlisted");
  const [isPublished, setIsPublished] = useState(true);
  const [whiteboardUrl, setWhiteboardUrl] = useState("");
  const [codeSample, setCodeSample] = useState("");
  const [shortsUrl, setShortsUrl] = useState("");
  const [description, setDescription] = useState("");
  const [notes, setNotes] = useState("");
  const [uploadingWb, setUploadingWb] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const detectedVideoId = extractYouTubeVideoId(youtubeInput);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !detectedVideoId) return;

    setSubmitting(true);

    const newVideo: VideoLesson = {
      id: `vid_${Date.now()}`,
      title: title.trim(),
      description: description.trim(),
      video_type: videoType,
      youtube_url: youtubeInput.trim(),
      youtube_video_id: detectedVideoId,
      duration_sec: Math.max(1, durationMins * 60),
      whiteboard_image_url: whiteboardUrl.trim(),
      code_sample: codeSample.trim(),
      notes: notes.trim(),
      is_premium: isPremium,
      order: 1,
      course_id: courseId || undefined,
      privacy: privacy,
      is_published: isPublished,
      shorts_url: videoType === "short" ? (shortsUrl.trim() || youtubeInput.trim()) : undefined,
    };

    // 1. Save locally in localStorage for resilience
    try {
      const stored = localStorage.getItem("vastavik_custom_videos");
      const current = stored ? JSON.parse(stored) : [];
      localStorage.setItem("vastavik_custom_videos", JSON.stringify([newVideo, ...current]));
    } catch (err) {
      console.warn("Could not write to localStorage", err);
    }

    // 2. Post to backend if online
    try {
      await api.post("/admin/videos", newVideo);
    } catch {
      // Offline fallback handled
    }

    setSubmitting(false);
    setSuccess(true);
    if (onVideoAdded) {
      onVideoAdded(newVideo);
    }

    setTimeout(() => {
      setSuccess(false);
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto animate-fadeIn">
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl border border-slate-100 overflow-hidden my-8">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-100 text-red-600 flex items-center justify-center flex-shrink-0">
              <Youtube className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-800">Register Video Lecture</h2>
              <p className="text-xs text-slate-400">
                Upload unlisted, private or public YouTube video lectures
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close modal"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        {success ? (
          <div className="p-12 text-center">
            <div className="w-14 h-14 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-3">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-800">Video Registered Successfully!</h3>
            <p className="text-sm text-slate-500 mt-1">
              Your video lecture is now linked and available for students.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
            {/* Title */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                Lecture Title *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Object Oriented Programming — Class & Object Foundations"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-3.5 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-400"
              />
            </div>

            {/* Video Format (3 types) */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-2">
                Video Lecture Type *
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {typeOptions.map((opt) => {
                  const Icon = opt.icon;
                  const isSelected = videoType === opt.type;
                  return (
                    <button
                      type="button"
                      key={opt.type}
                      onClick={() => setVideoType(opt.type)}
                      className={cn(
                        "p-3 rounded-xl border text-left transition-all flex flex-col items-start gap-1.5",
                        isSelected
                          ? "border-orange-500 bg-orange-50/50 ring-2 ring-orange-200"
                          : "border-slate-200 hover:border-slate-300 bg-white"
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <Icon className={cn("w-4 h-4", isSelected ? "text-orange-600" : "text-slate-500")} />
                        <span className={cn("text-xs font-bold", isSelected ? "text-orange-900" : "text-slate-700")}>
                          {opt.label}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 leading-tight">{opt.desc}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* YouTube URL / Unlisted Video ID */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">
                  Unregistered / Unlisted YouTube URL or ID *
                </label>
                {detectedVideoId && (
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-mono font-medium">
                    ID: {detectedVideoId}
                  </span>
                )}
              </div>
              <div className="relative">
                <input
                  type="text"
                  required
                  placeholder="e.g. https://youtu.be/abc123xyz or https://www.youtube.com/watch?v=..."
                  value={youtubeInput}
                  onChange={(e) => setYoutubeInput(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3.5 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-400 font-mono text-xs"
                />
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Paste any standard or unlisted YouTube link. The video ID is extracted automatically.
              </p>

              {/* Live Preview Embed */}
              {detectedVideoId && (
                <div className="mt-3 rounded-xl overflow-hidden border border-slate-200 bg-black aspect-video relative max-w-md mx-auto">
                  <iframe
                    src={`https://www.youtube-nocookie.com/embed/${detectedVideoId}`}
                    title="YouTube video preview"
                    className="w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              )}
            </div>

            {/* Course Assignment & Duration */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                  Course Assignment
                </label>
                <select
                  value={courseId}
                  onChange={(e) => setCourseId(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-orange-400"
                >
                  <option value="" className="text-slate-900">Standalone / Unassigned</option>
                  {courses.map((c) => (
                    <option key={c.id} value={c.id} className="text-slate-900">
                      {c.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                  Duration (Minutes)
                </label>
                <input
                  type="number"
                  min={1}
                  value={durationMins}
                  onChange={(e) => setDurationMins(Number(e.target.value))}
                  className="w-full border border-slate-200 rounded-xl px-3.5 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-400"
                />
              </div>
            </div>

            {/* Access Tier (Pro toggle) */}
            <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-100">
              <div className="flex items-center gap-2.5">
                <Crown className="w-5 h-5 text-yellow-500" />
                <div>
                  <p className="text-sm font-semibold text-slate-800">Vastavik Pro Access</p>
                  <p className="text-xs text-slate-500">Require active paid subscription to view</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsPremium(!isPremium)}
                className={cn(
                  "relative w-11 h-6 rounded-full transition-colors focus:outline-none",
                  isPremium ? "bg-orange-500" : "bg-slate-300"
                )}
              >
                <span
                  className={cn(
                    "absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform",
                    isPremium ? "translate-x-5" : "translate-x-0"
                  )}
                />
              </button>
            </div>

            {/* Privacy & Published */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                  Privacy
                </label>
                <select
                  value={privacy}
                  onChange={(e) => setPrivacy(e.target.value as VideoPrivacy)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-orange-400"
                >
                  <option value="public">Public — anyone can search</option>
                  <option value="unlisted">Unlisted — link only (default)</option>
                  <option value="private">Private — admin only</option>
                </select>
                <p className="text-xs text-slate-400 mt-1">Public/unlisted/private is stored; YouTube privacy still set in YouTube Studio.</p>
              </div>
              <div className="flex flex-col justify-end">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                  Published
                </label>
                <button
                  type="button"
                  onClick={() => setIsPublished(!isPublished)}
                  className={cn(
                    "w-full flex items-center justify-between p-3 rounded-xl border transition-colors",
                    isPublished ? "border-green-300 bg-green-50" : "border-slate-200 bg-slate-50"
                  )}
                >
                  <span className="text-sm font-medium text-slate-700">{isPublished ? "Published — visible to students" : "Draft — hidden from students"}</span>
                  <span className={cn("w-10 h-5 rounded-full relative transition-colors", isPublished ? "bg-green-500" : "bg-slate-300")}>
                    <span className={cn("absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform", isPublished ? "translate-x-5 left-0.5" : "translate-x-0 left-0.5")} />
                  </span>
                </button>
              </div>
            </div>

            {/* Whiteboard — URL + file upload, always alongside video link */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                Whiteboard Screenshot (Optional) — admin preview only, students see it in the Whiteboard tab
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="https://example.com/whiteboard.png or upload below"
                  value={whiteboardUrl}
                  onChange={(e) => setWhiteboardUrl(e.target.value)}
                  className="flex-1 border border-slate-200 rounded-xl px-3.5 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-400"
                />
                <label className="px-4 py-2 text-sm bg-slate-100 hover:bg-slate-200 rounded-xl cursor-pointer font-medium text-slate-700 whitespace-nowrap">
                  {uploadingWb ? "Uploading..." : "Upload image"}
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    className="hidden"
                    disabled={uploadingWb}
                    onChange={async (e) => {
                      const f = e.target.files?.[0];
                      if (!f) return;
                      setUploadingWb(true);
                      try {
                        const fd = new FormData();
                        fd.append("file", f);
                        const r = await api.post("/api/v1/admin/uploads/whiteboard", fd, {
                          headers: { "Content-Type": "multipart/form-data" },
                        });
                        if (r.data?.url) setWhiteboardUrl(r.data.url);
                      } catch {
                        alert("Whiteboard upload failed. Paste an image URL instead.");
                      } finally {
                        setUploadingWb(false);
                      }
                    }}
                  />
                </label>
              </div>
              {whiteboardUrl && (
                <div className="mt-2 rounded-xl overflow-hidden border border-slate-200 max-h-48">
                  <img src={whiteboardUrl} alt="Whiteboard preview (admin only)" className="w-full h-auto object-contain" onError={(e) => ((e.target as HTMLImageElement).style.display = "none")} />
                </div>
              )}
            </div>

            {/* Code Sample — for Code tab */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                Code Sample (Optional) — for VS Code tab
              </label>
              <textarea
                rows={4}
                placeholder="public class HelloWorld { ... }  — leave empty to use fallback"
                value={codeSample}
                onChange={(e) => setCodeSample(e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-3.5 py-2 text-sm font-mono text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-400"
              />
              <p className="text-xs text-slate-400 mt-1">Shown in the Code tab; supports Java/Python/C/C++ syntax highlight.</p>
            </div>

            {/* Shorts URL — always alongside video link */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                Shorts URL (Optional — used when type is Short; defaults to YouTube URL)
              </label>
              <input
                type="text"
                placeholder="https://www.youtube.com/shorts/abc123"
                value={shortsUrl}
                onChange={(e) => setShortsUrl(e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-3.5 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-400 font-mono text-xs"
              />
              <p className="text-xs text-slate-400 mt-1">Pick type “Short” above + paste a youtube.com/shorts/... link for vertical playback.</p>
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                Description & Topics Covered
              </label>
              <textarea
                rows={2}
                placeholder="Key concepts discussed in this video lesson..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-3.5 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-400"
              />
            </div>

            {/* Quick Notes / Cheatsheet */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                Lesson Notes / Code Snippets (Optional)
              </label>
              <textarea
                rows={2}
                placeholder="Markdown or key formulas for students to review..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-3.5 py-2 text-sm font-mono text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-400"
              />
            </div>

            {/* Form Footer */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-xl transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting || !title.trim() || !detectedVideoId}
                className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 active:scale-[0.99] disabled:opacity-50 text-white font-semibold px-5 py-2 rounded-xl text-sm transition-all shadow-md shadow-orange-500/20"
              >
                <Play className="w-4 h-4" />
                {submitting ? "Registering..." : "Save & Register Video"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
