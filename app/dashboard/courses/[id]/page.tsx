"use client";

import { useParams } from "next/navigation";
import { useState } from "react";
import { useCourseCurriculum, useCourses } from "@/hooks/useCourses";
import { ChevronRight, FileText, BookOpen, Plus, Youtube } from "lucide-react";
import Link from "next/link";
import { UploadVideoModal } from "@/components/courses/UploadVideoModal";
import { VideoLesson } from "@/types/api";

export default function CourseCurriculumPage() {
  const { id } = useParams<{ id: string }>();
  const { data, loading, addLessonToPart } = useCourseCurriculum(id);
  const { courses } = useCourses();
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [selectedPartId, setSelectedPartId] = useState<string | undefined>();

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
              <button
                onClick={() => { setSelectedPartId(part.part_id); setIsUploadOpen(true); }}
                className="flex items-center gap-1 text-xs text-orange-600 hover:bg-orange-50 px-2.5 py-1.5 rounded-lg transition-colors font-medium border border-orange-200"
              >
                <Plus className="w-3.5 h-3.5" /> Add Video Lesson
              </button>
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
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
