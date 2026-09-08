"use client";

import { useState } from "react";
import { useCourses } from "@/hooks/useCourses";
import { BookOpen, Plus, Eye, EyeOff, Edit, Youtube, WifiOff, Trash2 } from "lucide-react";
import { Course } from "@/types/api";
import Link from "next/link";
import { UploadVideoModal } from "@/components/courses/UploadVideoModal";
import { AddCourseModal } from "@/components/courses/AddCourseModal";

export default function CoursesPage() {
  const { courses, loading, isOffline, refetch, addCourse, deleteCourse } = useCourses();
  const [search, setSearch] = useState("");
  const [isAddCourseOpen, setIsAddCourseOpen] = useState(false);
  const [isUploadVideoOpen, setIsUploadVideoOpen] = useState(false);
  const [selectedCourseForVideo, setSelectedCourseForVideo] = useState<string | undefined>();

  const filtered = courses.filter((c) =>
    c.title.toLowerCase().includes(search.toLowerCase())
  );

  const handleOpenUploadForCourse = (courseId?: string) => {
    setSelectedCourseForVideo(courseId);
    setIsUploadVideoOpen(true);
  };

  const handleDeleteCourse = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to delete course "${title}"? This cannot be undone.`)) return;
    await deleteCourse(id);
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-5">
      {/* Offline notice (Non-blocking) */}
      {isOffline && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-xl px-4 py-2.5 text-xs flex items-center justify-between">
          <span className="flex items-center gap-2">
            <WifiOff className="w-4 h-4 text-amber-600 flex-shrink-0" />
            Backend server is offline. Running in offline cache mode — you can still create courses and register unlisted YouTube videos!
          </span>
          <button
            onClick={refetch}
            className="font-semibold underline ml-2 hover:text-amber-900 transition-colors flex-shrink-0"
          >
            Reconnect
          </button>
        </div>
      )}

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <input
          type="text"
          placeholder="Search courses…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 w-full sm:w-64"
        />
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <button
            onClick={() => handleOpenUploadForCourse()}
            className="flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white px-3.5 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm"
          >
            <Youtube className="w-4 h-4" /> Upload Video Lecture
          </button>
          <button
            onClick={() => setIsAddCourseOpen(true)}
            className="flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-3.5 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" /> New Course
          </button>
        </div>
      </div>

      {/* Modals */}
      <AddCourseModal
        isOpen={isAddCourseOpen}
        onClose={() => setIsAddCourseOpen(false)}
        onAddCourse={addCourse}
      />

      <UploadVideoModal
        isOpen={isUploadVideoOpen}
        onClose={() => setIsUploadVideoOpen(false)}
        courses={courses}
        preselectedCourseId={selectedCourseForVideo}
      />

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <BookOpen className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p>No courses found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((course) => (
            <CourseCard
              key={course.id}
              course={course}
              onAddVideo={(cid) => handleOpenUploadForCourse(cid)}
              onDelete={handleDeleteCourse}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function CourseCard({
  course,
  onAddVideo,
  onDelete,
}: {
  course: Course;
  onAddVideo?: (courseId: string) => void;
  onDelete?: (id: string, title: string) => void;
}) {
  const bgColor = `#${course.color.toString(16).padStart(6, "0")}22`;
  const borderColor = `#${course.color.toString(16).padStart(6, "0")}44`;

  return (
    <div
      className="bg-white rounded-xl p-5 shadow-sm border hover:shadow-md transition-shadow"
      style={{ borderColor }}
    >
      <div className="flex items-start justify-between mb-3">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center text-lg"
          style={{ backgroundColor: bgColor }}
        >
          <BookOpen className="w-5 h-5" style={{ color: `#${course.color.toString(16).padStart(6, "0")}` }} />
        </div>
        <span
          className={`text-xs px-2 py-0.5 rounded-full font-medium ${
            course.is_published
              ? "bg-green-100 text-green-700"
              : "bg-yellow-100 text-yellow-700"
          }`}
        >
          {course.is_published ? "Published" : "Draft"}
        </span>
      </div>

      <h3 className="font-semibold text-slate-800 text-sm mb-1 line-clamp-2">
        {course.title}
      </h3>
      <p className="text-xs text-slate-500 line-clamp-2 mb-4">{course.description}</p>

      <div className="flex gap-2">
        <Link
          href={`/dashboard/courses/${course.id}`}
          className="flex-1 flex items-center justify-center gap-1.5 border border-slate-200 rounded-lg py-1.5 text-xs text-slate-600 hover:bg-slate-50 transition-colors"
        >
          <Edit className="w-3 h-3" /> Edit Curriculum
        </Link>
        {onAddVideo && (
          <button
            onClick={() => onAddVideo(course.id)}
            className="flex items-center justify-center gap-1 px-2.5 py-1.5 border border-red-200 text-red-600 hover:bg-red-50 rounded-lg text-xs font-medium transition-colors"
            title="Upload/Register unlisted YouTube video lecture"
          >
            <Youtube className="w-3.5 h-3.5" /> + Video
          </button>
        )}
        <button
          className="w-8 h-8 flex items-center justify-center border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
          title={course.is_published ? "Unpublish" : "Publish"}
        >
          {course.is_published ? (
            <EyeOff className="w-3.5 h-3.5 text-slate-500" />
          ) : (
            <Eye className="w-3.5 h-3.5 text-slate-500" />
          )}
        </button>
        {onDelete && (
          <button
            onClick={() => onDelete(course.id, course.title)}
            className="w-8 h-8 flex items-center justify-center border border-rose-200 text-rose-500 hover:bg-rose-50 hover:text-rose-700 rounded-lg transition-colors"
            title="Delete course"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}

function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full" />
    </div>
  );
}

function ErrorBanner({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
      <p className="text-red-700 mb-3">{message}</p>
      <button
        onClick={onRetry}
        className="bg-red-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-red-600 transition-colors"
      >
        Retry
      </button>
    </div>
  );
}
