import { useEffect, useState, useCallback } from "react";
import api from "@/lib/api";
import { Course, CourseCurriculum } from "@/types/api";

export const DEFAULT_COURSES: Course[] = [
  {
    id: "java-icse-10",
    title: "Java for ICSE Class 10",
    description: "Complete ICSE Computer Applications curriculum covering OOP, String handling, Arrays, and Past Year Questions.",
    icon_name: "code",
    color: 0xFFE65100,
    order: 1,
    is_published: true,
  },
  {
    id: "python-basics",
    title: "Python for Beginners",
    description: "Learn core Python 3 syntax, control structures, functions, lists, dictionaries, and automated problem solving.",
    icon_name: "terminal",
    color: 0xFF1976D2,
    order: 2,
    is_published: true,
  },
  {
    id: "sql-databases",
    title: "SQL & Relational Databases",
    description: "Practical database design, queries, table joins, aggregation, subqueries, and ICSE/CBSE exam patterns.",
    icon_name: "database",
    color: 0xFF7B1FA2,
    order: 3,
    is_published: true,
  },
  {
    id: "js-web-dev",
    title: "JavaScript Essentials",
    description: "Modern JavaScript (ES6+), DOM manipulation, async/await, APIs, and building interactive web projects.",
    icon_name: "globe",
    color: 0xFFF57C00,
    order: 4,
    is_published: true,
  },
];

export function useCourses() {
  const [courses, setCourses] = useState<Course[]>(DEFAULT_COURSES);
  const [loading, setLoading] = useState(true);
  const [isOffline, setIsOffline] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getStoredCourses = (): Course[] => {
    if (typeof window === "undefined") return [];
    try {
      const stored = localStorage.getItem("vastavik_custom_courses");
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  };

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get<{ courses: Course[] }>("/api/v1/catalog/home");
      const serverCourses = res.data.courses ?? [];
      const customCourses = getStoredCourses();
      const customOnly = customCourses.filter((c) => !serverCourses.some((s) => s.id === c.id));
      setCourses([...serverCourses, ...customOnly]);
      setIsOffline(false);
    } catch {
      // Backend offline or connection refused: fall back to default demo courses + custom local courses
      const customCourses = getStoredCourses();
      const customOnly = customCourses.filter((c) => !DEFAULT_COURSES.some((s) => s.id === c.id));
      setCourses([...DEFAULT_COURSES, ...customOnly]);
      setIsOffline(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetch();
  }, [fetch]);

  const addCourse = async (newCourse: Omit<Course, "id"> & { id?: string }) => {
    const courseId = newCourse.id || `course_${Date.now()}`;
    const course: Course = {
      ...newCourse,
      id: courseId,
      order: courses.length + 1,
    };

    // 1. Optimistic update in state
    setCourses((prev) => [course, ...prev]);

    // 2. Persist in localStorage
    try {
      const current = getStoredCourses();
      localStorage.setItem(
        "vastavik_custom_courses",
        JSON.stringify([course, ...current.filter((c) => c.id !== courseId)])
      );
    } catch (e) {
      console.warn("Could not save to localStorage", e);
    }

    try {
      await api.post("/admin/courses", course);
    } catch {
      // Offline fallback already handled
    }

    return course;
  };

  const deleteCourse = async (courseId: string) => {
    // 1. Optimistic update in state
    setCourses((prev) => prev.filter((c) => c.id !== courseId));

    // 2. Remove from localStorage
    try {
      const current = getStoredCourses();
      localStorage.setItem(
        "vastavik_custom_courses",
        JSON.stringify(current.filter((c) => c.id !== courseId))
      );
    } catch (e) {
      console.warn("Could not remove course from localStorage", e);
    }

    // 3. Delete from backend if available
    try {
      await api.delete(`/admin/courses/${courseId}`);
    } catch (e) {
      console.warn("Could not delete course from backend", e);
    }
  };

  return { courses, loading, isOffline, error, refetch: fetch, addCourse, deleteCourse };
}

export function useCourseCurriculum(courseId: string) {
  const [data, setData] = useState<CourseCurriculum | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const getStoredCurriculum = (cid: string): CourseCurriculum | null => {
    if (typeof window === "undefined") return null;
    try {
      const stored = localStorage.getItem(`vastavik_curriculum_${cid}`);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  };

  const fetchCurriculum = useCallback(async () => {
    if (!courseId) return;
    setLoading(true);
    try {
      const r = await api.get<CourseCurriculum>(`/api/v1/courses/${courseId}/curriculum`);
      setData(r.data);
    } catch {
      const local = getStoredCurriculum(courseId);
      if (local) {
        setData(local);
      } else {
        // Fallback demo curriculum for the course
        setData({
          course_id: courseId,
          parts: [
            {
              part_id: "part_1",
              title: "Module 1: Foundations & Architecture",
              description: "Fundamental principles, environment setup, and foundational concepts.",
              order: 1,
              subparts: [
                { subpart_id: "sub_1", title: "Introduction & Setup", lesson_id: "lesson_1" },
                { subpart_id: "sub_2", title: "Variables, Syntax & Data Flow", lesson_id: "lesson_2" },
              ],
            },
            {
              part_id: "part_2",
              title: "Module 2: Advanced Concept Mastery",
              description: "Deep dive with live coding walkthroughs and practice questions.",
              order: 2,
              subparts: [
                { subpart_id: "sub_3", title: "Core Logic & Algorithms", lesson_id: "lesson_3" },
                { subpart_id: "sub_4", title: "Problem Solving & Past Paper Analysis", lesson_id: "lesson_4" },
              ],
            },
          ],
        });
      }
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    fetchCurriculum();
  }, [fetchCurriculum]);

  const addLessonToPart = async (partId: string, lessonTitle: string, lessonId: string) => {
    if (!data) return;
    const updatedParts = data.parts.map((p) => {
      if (p.part_id === partId) {
        return {
          ...p,
          subparts: [
            ...p.subparts,
            {
              subpart_id: `sub_${Date.now()}`,
              title: lessonTitle,
              lesson_id: lessonId,
            },
          ],
        };
      }
      return p;
    });

    const updatedCurriculum: CourseCurriculum = {
      ...data,
      parts: updatedParts,
    };

    setData(updatedCurriculum);

    try {
      localStorage.setItem(`vastavik_curriculum_${courseId}`, JSON.stringify(updatedCurriculum));
      await api.post(`/admin/courses/${courseId}/parts/${partId}/lessons`, {
        title: lessonTitle,
        lesson_id: lessonId,
      });
    } catch {
      // offline fallback
    }
  };

  const removeLessonFromPart = async (partId: string, subpartId: string, deleteVideo = false) => {
    if (!data) return;
    const prev = data;
    const updatedParts = data.parts.map((p) => {
      if (p.part_id === partId) {
        return { ...p, subparts: p.subparts.filter((s) => s.subpart_id !== subpartId) };
      }
      return p;
    });
    setData({ ...data, parts: updatedParts });

    try {
      localStorage.setItem(`vastavik_curriculum_${courseId}`, JSON.stringify({ ...data, parts: updatedParts }));
    } catch {
      // offline fallback
    }
    try {
      await api.delete(`/admin/courses/${courseId}/parts/${partId}/subparts/${subpartId}${deleteVideo ? "?delete_video=true" : ""}`);
    } catch {
      // rollback on failure
      setData(prev);
      throw new Error("Could not delete lesson on the server. Please retry.");
    }
  };

  const removePart = async (partId: string) => {
    if (!data) return;
    const prev = data;
    setData({ ...data, parts: data.parts.filter((p) => p.part_id !== partId) });

    try {
      localStorage.setItem(
        `vastavik_curriculum_${courseId}`,
        JSON.stringify({ ...data, parts: data.parts.filter((p) => p.part_id !== partId) })
      );
    } catch {
      // offline fallback
    }
    try {
      await api.delete(`/admin/courses/${courseId}/parts/${partId}`);
    } catch {
      setData(prev);
      throw new Error("Could not delete part on the server. Please retry.");
    }
  };

  return { data, loading, error, addLessonToPart, removeLessonFromPart, removePart, refetch: fetchCurriculum };
}

