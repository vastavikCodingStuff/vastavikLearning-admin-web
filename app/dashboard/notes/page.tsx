"use client";

import { useEffect, useState } from "react";
import { StickyNote, Search, Tag } from "lucide-react";
import api from "@/lib/api";
import { StudentNote } from "@/types/api";
import { formatDate, truncate } from "@/lib/utils";

export default function NotesPage() {
  const [notes, setNotes] = useState<StudentNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    api.get<{ notes: StudentNote[] }>("/admin/notes")
      .then((r) => setNotes(r.data.notes ?? []))
      .catch(() => {
        setNotes([
          { id: "n1", uid: "uid_0", student_name: "Parth Shah", title: "OOP Notes", content: "Encapsulation is the bundling of data and methods. Access modifiers: public, private, protected, default.", tag: "Java", created_at: new Date().toISOString() },
          { id: "n2", uid: "uid_1", student_name: "Ananya Mehta", title: "Binary Search", content: "Binary search works on sorted arrays. Time complexity: O(log n). Divide and conquer approach.", tag: "DSA", created_at: new Date(Date.now() - 3600000).toISOString() },
          { id: "n3", uid: "uid_2", student_name: "Rohan Gupta", title: "SQL Joins", content: "INNER JOIN returns matching rows. LEFT JOIN returns all from left + matching from right.", tag: "SQL", created_at: new Date(Date.now() - 7200000).toISOString() },
          { id: "n4", uid: "uid_0", student_name: "Parth Shah", title: "Python Lists", content: "Lists are mutable sequences. append(), extend(), insert(), remove(), pop() are common methods.", tag: "Python", created_at: new Date(Date.now() - 86400000).toISOString() },
        ]);
      })
      .finally(() => setLoading(false));
  }, []);

  const filtered = notes.filter((n) =>
    n.title.toLowerCase().includes(search.toLowerCase()) ||
    n.student_name.toLowerCase().includes(search.toLowerCase()) ||
    n.tag.toLowerCase().includes(search.toLowerCase())
  );

  const tagColors: Record<string, string> = {
    Java: "bg-orange-100 text-orange-700",
    Python: "bg-blue-100 text-blue-700",
    SQL: "bg-purple-100 text-purple-700",
    JavaScript: "bg-yellow-100 text-yellow-700",
    DSA: "bg-green-100 text-green-700",
  };

  return (
    <div className="space-y-5">
      <div className="relative w-full sm:w-72">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Search notes, students, tags…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400 w-full"
        />
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl p-5 animate-pulse border border-slate-100">
              <div className="h-4 bg-slate-100 rounded w-3/4 mb-3" />
              <div className="h-3 bg-slate-100 rounded w-full mb-2" />
              <div className="h-3 bg-slate-100 rounded w-2/3" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <StickyNote className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p>No notes found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((note) => (
            <div key={note.id} className="bg-white rounded-xl p-5 shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-2">
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex items-center gap-1 ${tagColors[note.tag] ?? "bg-slate-100 text-slate-600"}`}>
                  <Tag className="w-3 h-3" /> {note.tag}
                </span>
                <span className="text-xs text-slate-300">{formatDate(note.created_at)}</span>
              </div>
              <h3 className="font-semibold text-slate-800 text-sm mb-1">{note.title}</h3>
              <p className="text-xs text-slate-500 mb-3 leading-relaxed">{truncate(note.content, 120)}</p>
              <div className="flex items-center gap-2 pt-3 border-t border-slate-50">
                <div className="w-5 h-5 bg-orange-100 rounded-full flex items-center justify-center text-orange-600 text-xs font-bold">
                  {note.student_name.charAt(0)}
                </div>
                <span className="text-xs text-slate-500">{note.student_name}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
