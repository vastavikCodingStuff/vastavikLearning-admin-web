"use client";

import { useParams } from "next/navigation";
import { useState } from "react";
import { useCourseCurriculum, useCourses } from "@/hooks/useCourses";
import { ChevronRight, FileText, BookOpen, Plus, Youtube, Trash2 } from "lucide-react";
import Link from "next/link";
import { UploadVideoModal } from "@/components/courses/UploadVideoModal";
import { VideoLesson } from "@/types/api";

export default function CourseCurriculumPage() {
  const { id } = useParams<{ id: string }>();
  const { data, loading, addLessonToPart, removeLessonFromPart, removePart, refetch } = useCourseCurriculum(id);
  const { courses } = useCourses();
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [selectedPartId, setSelectedPartId] = useState<string | undefined>();
  const [deleting, setDeleting] = useState<string | null>(null);

  const handleDeleteLesson = async (partId: string, subpartId: string, title: string) => {
    if (!confirm(`Delete lesson "${title}" from this part? The curriculum link is removed immediately.`)) return;
    const withVideo = confirm("Also delete the linked video file itself? OK = yes, Cancel = keep video.");
    setDeleting(subpartId);
    try {
      await removeLessonFromPart?.(partId, subpartId, withVideo);
      await refetch?.();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Delete failed. Please retry.");
    } finally {
      setDeleting(null);
    }
  };

  const handleDeletePart = async (partId: string, title: string, count: number) => {
    if (!confirm(`Delete part "${title}" and its ${count} lesson(s)? This cannot be undone.`)) return;
    setDeleting(partId);
    try {
      await removePart?.(partId);
      await refetch?.();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Delete failed. Please retry.");
    } finally {
      setDeleting(null);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full" />
    </div>
  );
  if (!data) return null;

  const handleVideoAdded = (video: VideoLesson) => {
    const targetPartId = selectedPartId || data.parts[0]?.part_id;
    if (targetPartId && addLessonToPart) {
      addLessonToPart(targetPartId, video.title, video.id);
    }
  };

  return (
    <div className="max-w-3xl space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2">
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <Link href="/dashboard/courses" className="hover:text-orange-500 transition-colors">
            Courses
          </Link>
          <ChevronRight className="w-4 h-4" />
          <span className="text-slate-800 font-medium">Curriculum Editor</span>
        </div>
        <button
          onClick={() => { setSelectedPartId(undefined); setIsUploadOpen(true); }}
          className="flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors shadow-sm"
        >
          <Youtube className="w-3.5 h-3.5" /> Upload Video Lecture
        </button>
      </div>

      <UploadVideoModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        courses={courses}
        preselectedCourseId={id}
        onVideoAdded={handleVideoAdded}
      />

      {data.parts.length === 0 ? (
        <div className="bg-white rounded-xl p-10 text-center shadow-sm border">
          <BookOpen className="w-10 h-10 mx-auto text-slate-300 mb-3" />
          <p className="text-slate-500">No curriculum parts yet.</p>
        </div>
      ) : (
        data.parts.map((part, pi) => (
          <div key={part.part_id} className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-3">
                <span className="w-7 h-7 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center text-xs font-bold">
                  {pi + 1}
                </span>
                <div>
                  <p className="font-semibold text-slate-800 text-sm">{part.title}</p>
                  <p className="text-xs text-slate-400">{part.subparts.length} lessons</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => { setSelectedPartId(part.part_id); setIsUploadOpen(true); }}
                  className="flex items-center gap-1 text-xs text-orange-600 hover:bg-orange-50 px-2.5 py-1.5 rounded-lg transition-colors font-medium border border-orange-200"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Video Lesson
                </button>
                <button
                  onClick={() => handleDeletePart(part.part_id, part.title, part.subparts.length)}
                  disabled={deleting === part.part_id}
                  title="Delete this part and all its lessons"
                  className="flex items-center gap-1 text-xs text-red-500 hover:bg-red-50 px-2.5 py-1.5 rounded-lg transition-colors font-medium border border-red-200 disabled:opacity-50"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Delete Part
                </button>
              </div>
            </div>

            <div className="divide-y divide-slate-50">
              {part.subparts.map((sub, si) => (
                <div key={sub.subpart_id} className="px-5 py-3 flex items-center gap-3 hover:bg-slate-50 transition-colors">
                  <FileText className="w-4 h-4 text-slate-400 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-700 truncate">{sub.title}</p>
                    <p className="text-xs text-slate-400">Lesson ID: {sub.lesson_id}</p>
                  </div>
                  <span className="text-xs text-slate-300">{si + 1}</span>
                  <button
                    onClick={() => handleDeleteLesson(part.part_id, sub.subpart_id, sub.title)}
                    disabled={deleting === sub.subpart_id}
                    title="Delete this lesson"
                    className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
