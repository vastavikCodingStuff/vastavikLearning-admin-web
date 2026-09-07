"use client";

import { useEffect, useState } from "react";
import { Plus, Code2, Search, ChevronDown, ChevronUp } from "lucide-react";
import api from "@/lib/api";
import { CodingExercise } from "@/types/api";
import { formatDate, languageColor } from "@/lib/utils";

export default function PracticeCodingPage() {
  const [exercises, setExercises] = useState<CodingExercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    api.get<{ exercises: CodingExercise[] }>("/admin/practice/coding")
      .then((r) => setExercises(r.data.exercises ?? []))
      .catch(() => {
        setExercises([
          {
            id: "ce1", title: "FizzBuzz", language: "java",
            description: "Print numbers 1-100. For multiples of 3 print 'Fizz', for 5 print 'Buzz', for both print 'FizzBuzz'.",
            starter_code: "public class FizzBuzz {\n  public static void main(String[] args) {\n    // Your code here\n  }\n}",
            solution_code: "for(int i=1;i<=100;i++){\n  if(i%15==0) System.out.println(\"FizzBuzz\");\n  else if(i%3==0) System.out.println(\"Fizz\");\n  else if(i%5==0) System.out.println(\"Buzz\");\n  else System.out.println(i);\n}",
            test_cases: [{ input: "", expected_output: "1\n2\nFizz\n4\nBuzz\nFizz\n7\n8\nFizz\nBuzz" }],
            difficulty: "easy", created_at: new Date().toISOString()
          },
          {
            id: "ce2", title: "Fibonacci Series", language: "python",
            description: "Generate the first N Fibonacci numbers.",
            starter_code: "def fibonacci(n):\n    # Your code here\n    pass",
            solution_code: "def fibonacci(n):\n    a, b = 0, 1\n    for _ in range(n):\n        print(a)\n        a, b = b, a+b",
            test_cases: [{ input: "5", expected_output: "0\n1\n1\n2\n3" }],
            difficulty: "easy", created_at: new Date(Date.now() - 86400000).toISOString()
          },
        ]);
      })
      .finally(() => setLoading(false));
  }, []);

  const filtered = exercises.filter((e) =>
    e.title.toLowerCase().includes(search.toLowerCase()) ||
    e.language.toLowerCase().includes(search.toLowerCase())
  );

  const diffColor: Record<string, string> = {
    easy: "bg-green-100 text-green-700",
    medium: "bg-yellow-100 text-yellow-700",
    hard: "bg-red-100 text-red-700",
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search exercises…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400 w-full"
          />
        </div>
        <button className="flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors w-full sm:w-auto">
          <Plus className="w-4 h-4" /> New Exercise
        </button>
      </div>

      <div className="space-y-3">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl p-5 animate-pulse border border-slate-100">
              <div className="h-4 bg-slate-100 rounded w-1/2 mb-2" />
              <div className="h-3 bg-slate-100 rounded w-1/4" />
            </div>
          ))
        ) : (
          filtered.map((ex) => (
            <div key={ex.id} className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
              <button
                onClick={() => setExpanded(expanded === ex.id ? null : ex.id)}
                className="w-full flex items-center gap-4 px-5 py-4 hover:bg-slate-50 transition-colors text-left"
              >
                <Code2 className="w-5 h-5 text-orange-500 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-0.5">
                    <p className="font-semibold text-slate-800 text-sm">{ex.title}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${languageColor(ex.language)}`}>{ex.language.toUpperCase()}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${diffColor[ex.difficulty]}`}>{ex.difficulty}</span>
                  </div>
                  <p className="text-xs text-slate-400 truncate">{ex.description}</p>
                </div>
                {expanded === ex.id ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
              </button>

              {expanded === ex.id && (
                <div className="border-t border-slate-100 p-5 space-y-4">
                  <div>
                    <p className="text-xs font-semibold text-slate-500 mb-1.5">Description</p>
                    <p className="text-sm text-slate-700">{ex.description}</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs font-semibold text-slate-500 mb-1.5">Starter Code</p>
                      <pre className="bg-slate-900 text-green-400 text-xs rounded-lg p-3 overflow-x-auto">{ex.starter_code}</pre>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-500 mb-1.5">Solution</p>
                      <pre className="bg-slate-900 text-blue-300 text-xs rounded-lg p-3 overflow-x-auto">{ex.solution_code}</pre>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-500 mb-1.5">Test Cases ({ex.test_cases.length})</p>
                    {ex.test_cases.map((tc, i) => (
                      <div key={i} className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-2">
                        <div>
                          <p className="text-xs text-slate-400 mb-0.5">Input</p>
                          <pre className="bg-slate-50 text-slate-700 text-xs rounded p-2 border border-slate-100">{tc.input || "(none)"}</pre>
                        </div>
                        <div>
                          <p className="text-xs text-slate-400 mb-0.5">Expected Output</p>
                          <pre className="bg-green-50 text-green-800 text-xs rounded p-2 border border-green-100">{tc.expected_output}</pre>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
