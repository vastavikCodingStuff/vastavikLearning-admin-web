"use client";

import { useState } from "react";
import { X, BookOpen, Plus, CheckCircle2 } from "lucide-react";
import { Course } from "@/types/api";
import { cn } from "@/lib/utils";

interface AddCourseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddCourse: (course: Omit<Course, "id">) => Promise<Course | void>;
}

const colorPresets = [
  { label: "Orange", hex: 0xFFE65100, bg: "bg-orange-500" },
  { label: "Blue", hex: 0xFF1976D2, bg: "bg-blue-600" },
  { label: "Purple", hex: 0xFF7B1FA2, bg: "bg-purple-600" },
  { label: "Emerald", hex: 0xFF059669, bg: "bg-emerald-600" },
  { label: "Rose", hex: 0xFFE11D48, bg: "bg-rose-600" },
];

export function AddCourseModal({ isOpen, onClose, onAddCourse }: AddCourseModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedColor, setSelectedColor] = useState(colorPresets[0].hex);
  const [iconName, setIconName] = useState("code");
  const [isPublished, setIsPublished] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setSubmitting(true);
    try {
      await onAddCourse({
        title: title.trim(),
        description: description.trim(),
        color: selectedColor,
        icon_name: iconName,
        order: 1,
        is_published: isPublished,
      });
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onClose();
        setTitle("");
        setDescription("");
      }, 1000);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl border border-slate-100 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800">Create New Course</h2>
              <p className="text-xs text-slate-400">Add a curriculum track to Vastavik Learning</p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        {success ? (
          <div className="p-10 text-center">
            <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-3">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-800">Course Created!</h3>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                Course Title *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Java Masterclass for ICSE Class 10"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-3.5 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-400"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                Description
              </label>
              <textarea
                rows={3}
                placeholder="What students will learn in this course..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-3.5 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-400"
              />
            </div>

            {/* Color Accent */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-2">
                Brand Color Accent
              </label>
              <div className="flex gap-3">
                {colorPresets.map((c) => (
                  <button
                    type="button"
                    key={c.label}
                    onClick={() => setSelectedColor(c.hex)}
                    className={cn(
                      "w-8 h-8 rounded-full transition-transform",
                      c.bg,
                      selectedColor === c.hex ? "ring-4 ring-orange-200 scale-110" : "opacity-80 hover:opacity-100"
                    )}
                    title={c.label}
                  />
                ))}
              </div>
            </div>

            {/* Published Toggle */}
            <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-100">
              <div>
                <p className="text-sm font-semibold text-slate-800">Publish Immediately</p>
                <p className="text-xs text-slate-500">Visible to all students in the mobile catalog</p>
              </div>
              <button
                type="button"
                onClick={() => setIsPublished(!isPublished)}
                className={cn(
                  "relative w-11 h-6 rounded-full transition-colors focus:outline-none",
                  isPublished ? "bg-orange-500" : "bg-slate-300"
                )}
              >
                <span
                  className={cn(
                    "absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform",
                    isPublished ? "translate-x-5" : "translate-x-0"
                  )}
                />
              </button>
            </div>

            {/* Footer */}
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
                disabled={submitting || !title.trim()}
                className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 active:scale-[0.99] disabled:opacity-50 text-white font-semibold px-5 py-2 rounded-xl text-sm transition-all shadow-md shadow-orange-500/20"
              >
                <Plus className="w-4 h-4" />
                {submitting ? "Creating..." : "Create Course"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
