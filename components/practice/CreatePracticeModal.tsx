"use client";

import { useState, useRef } from "react";
import { X, FileText, FileUp, Sparkles, Loader2, CheckCircle2, AlertTriangle, Pencil, Trash2, Plus } from "lucide-react";
import api from "@/lib/api";
import { cn } from "@/lib/utils";

type ContentType = "quiz" | "coding" | "mcq" | "pyq" | "predict_output";

interface CreatePracticeModalProps {
  isOpen: boolean;
  onClose: () => void;
  contentType: ContentType;
  onCreated?: (info: { count: number; set_id?: string }) => void;
}

const TITLES: Record<ContentType, { heading: string; sub: string; subjectLabel: string; subjectHint: string }> = {
  quiz: {
    heading: "Add Quiz Set",
    sub: "Generate a set of multiple-choice questions, then optionally add to a named set.",
    subjectLabel: "Subject",
    subjectHint: "e.g. Java, Python, SQL",
  },
  predict_output: {
    heading: "Add Predict the Output Sets",
    sub: "Code snippet tracing problems with expected console output.",
    subjectLabel: "Topic / Language",
    subjectHint: "e.g. Loops & Control Flow, Strings, Arrays (Java/Python)",
  },
  mcq: {
    heading: "Add MCQs",
    sub: "Standalone multiple-choice questions, organised by subject and topic.",
    subjectLabel: "Subject",
    subjectHint: "e.g. Java, Python, SQL",
  },
  coding: {
    heading: "Add Coding Exercises",
    sub: "Coding problems with starter code, solution, and test cases.",
    subjectLabel: "Subject / Language",
    subjectHint: "e.g. Java, Python",
  },
  pyq: {
    heading: "Add Past Year Questions",
    sub: "Tip: use 'Board | Year | Subject' for the subject field, e.g. 'ICSE | 2024 | Computer Applications'.",
    subjectLabel: "Board | Year | Subject",
    subjectHint: "ICSE | 2024 | Computer Applications",
  },
};

export function CreatePracticeModal({ isOpen, onClose, contentType, onCreated }: CreatePracticeModalProps) {
  const [mode, setMode] = useState<"write" | "pdf" | null>(null);
  const [subject, setSubject] = useState("");
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<{ count: number; set_id?: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [previewItems, setPreviewItems] = useState<any[] | null>(null);
  const [previewRaw, setPreviewRaw] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const reset = () => {
    setMode(null);
    setSubject("");
    setTitle("");
    setText("");
    setFile(null);
    setSubmitting(false);
    setSaving(false);
    setResult(null);
    setError(null);
    setPreviewItems(null);
    setPreviewRaw(null);
  };

  const close = () => {
    if (submitting || saving) return;
    reset();
    onClose();
  };

  const handleParse = async () => {
    if (!mode) return;
    if (!subject.trim()) {
      setError("Please fill in the subject.");
      return;
    }
    if (mode === "write" && !text.trim()) {
      setError("Please paste or type the content.");
      return;
    }
    if (mode === "pdf" && !file) {
      setError("Please select a PDF file.");
      return;
    }
    setSubmitting(true);
    setError(null);
    // Helper to try parse endpoint, fallback to legacy ingest if backend not yet deployed (404)
    const tryParse = async (): Promise<any> => {
      try {
        if (mode === "write") {
          return await api.post(`/admin/practice/parse`, {
            content_type: contentType,
            subject: subject.trim(),
            title: title.trim() || undefined,
            text: text.trim(),
            model: "minimax/minimax-m2:free",
          });
        } else {
          const fd = new FormData();
          fd.append("content_type", contentType);
          fd.append("subject", subject.trim());
          if (title.trim()) fd.append("title", title.trim());
          fd.append("file", file as File);
          fd.append("model", "minimax/minimax-m2:free");
          return await api.post(`/admin/practice/parse/upload`, fd, {
            headers: { "Content-Type": "multipart/form-data" },
          });
        }
      } catch (err: any) {
        const status = err?.response?.status;
        if (status === 404) {
          // Backend not yet deployed with new parse endpoint -> fallback to legacy ingest which exists live
          // This directly saves; we show success without editable preview as graceful degradation
          if (mode === "write") {
            const fallback = await api.post(`/admin/practice/ingest`, {
              content_type: contentType,
              subject: subject.trim(),
              title: title.trim() || undefined,
              text: text.trim(),
              model: "minimax/minimax-m2:free",
            });
            setResult({ count: fallback.data.created_count ?? 0, set_id: fallback.data.set_id });
            onCreated?.({ count: fallback.data.created_count ?? 0, set_id: fallback.data.set_id });
            return null; // signal fallback handled
          } else {
            const fd2 = new FormData();
            fd2.append("content_type", contentType);
            fd2.append("subject", subject.trim());
            if (title.trim()) fd2.append("title", title.trim());
            fd2.append("file", file as File);
            fd2.append("model", "minimax/minimax-m2:free");
            const fallback = await api.post(`/admin/practice/ingest/upload`, fd2, {
              headers: { "Content-Type": "multipart/form-data" },
            });
            setResult({ count: fallback.data.created_count ?? 0, set_id: fallback.data.set_id });
            onCreated?.({ count: fallback.data.created_count ?? 0, set_id: fallback.data.set_id });
            return null;
          }
        }
        throw err;
      }
    };
    try {
      const resp = await tryParse();
      if (!resp) return; // fallback already handled
      const parsed = resp.data.parsed;
      let items: any[] = [];
      if (contentType === "coding") items = parsed.exercises || parsed.questions || [];
      else if (contentType === "predict_output") items = parsed.sets || parsed.questions || parsed.items || [];
      else items = parsed.questions || parsed.exercises || [];
      if (!items.length) {
        setError("AI returned no items. Try with more detailed content.");
        return;
      }
      setPreviewRaw(parsed);
      setPreviewItems(items);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { detail?: string; message?: string; status?: string } } };
      // Surface PyPDF missing nicely if backend still old
      const detail = e?.response?.data?.detail || "";
      if (detail.includes("PyPDF2") || detail.includes("pypdf")) {
        setError("PDF parser missing on server. Backend is redeploying with fix — try again in 1-2 minutes, or use Write mode.");
      } else {
        setError(e?.response?.data?.detail ?? e?.response?.data?.message ?? "AI parse failed. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveEdited = async () => {
    if (!previewItems) return;
    setSaving(true);
    setError(null);
    try {
      const resp = await api.post(`/admin/practice/save`, {
        content_type: contentType,
        subject: subject.trim(),
        title: title.trim() || undefined,
        items: previewItems,
        set_id: (previewRaw as any)?.set_id || undefined,
      });
      setResult({ count: resp.data.created_count ?? previewItems.length, set_id: resp.data.set_id });
      onCreated?.({ count: resp.data.created_count ?? previewItems.length, set_id: resp.data.set_id });
      setPreviewItems(null);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { detail?: string; message?: string } } };
      setError(e?.response?.data?.detail ?? e?.response?.data?.message ?? "Save failed. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const updateItem = (idx: number, patch: any) => {
    setPreviewItems((prev) => {
      if (!prev) return prev;
      const copy = [...prev];
      copy[idx] = { ...copy[idx], ...patch };
      return copy;
    });
  };
  const removeItem = (idx: number) => {
    setPreviewItems((prev) => prev ? prev.filter((_, i) => i !== idx) : prev);
  };
  const addItem = () => {
    const blank = contentType === "coding"
      ? { title: "New Exercise", description: "", language: "java", starter_code: "", solution_code: "", test_cases: [], difficulty: "easy" }
      : contentType === "pyq"
      ? { question: "New question", solution: "", marks: 5 }
      : contentType === "predict_output"
      ? { title: "Predict Output Problem", topic: subject || "General", question_count: "10 Questions", difficulty: "Easy", code_snippet: "// Code to trace\nint x = 5;\nSystem.out.println(x * 2);", expected_output: "10" }
      : { question: "New question", options: ["A","B","C","D"], correct_index: 0, explanation: "", difficulty: "easy", topic: subject };
    setPreviewItems((prev) => prev ? [...prev, blank] : [blank]);
  };

  const heading = TITLES[contentType].heading;
  const sub = TITLES[contentType].sub;
  const subjectLabel = TITLES[contentType].subjectLabel;
  const subjectHint = TITLES[contentType].subjectHint;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto animate-fadeIn">
      <div className="bg-white rounded-2xl w-full max-w-3xl shadow-2xl border border-slate-100 overflow-hidden my-8">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-800">{heading}</h2>
              <p className="text-xs text-slate-500">{sub}</p>
            </div>
          </div>
          <button onClick={close} aria-label="Close" className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {result ? (
          <div className="p-10 text-center">
            <div className="w-14 h-14 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-3">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-800">Saved!</h3>
            <p className="text-sm text-slate-500 mt-1">
              {result.count} {contentType === "coding" ? "exercise" : contentType === "predict_output" ? "set" : "question"}{result.count === 1 ? "" : "s"} added
              {result.set_id ? ` to set ${result.set_id.slice(0, 8)}…` : ""}.
            </p>
            <button onClick={close} className="mt-6 bg-orange-500 hover:bg-orange-600 text-white font-semibold px-5 py-2 rounded-xl text-sm transition-colors">
              Done
            </button>
          </div>
        ) : previewItems ? (
          <div className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-slate-800 flex items-center gap-2"><Pencil className="w-4 h-4 text-orange-500" /> Review & edit AI output ({previewItems.length} items)</p>
              <button onClick={addItem} className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-full flex items-center gap-1"><Plus className="w-3 h-3" /> Add</button>
            </div>
            <p className="text-xs text-slate-500">Everything below is editable. Fix options, answers, or text before saving.</p>
            <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-1">
              {previewItems.map((it, idx) => (
                <div key={idx} className="border border-slate-200 rounded-xl p-3 bg-slate-50/50">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-bold text-slate-700">#{idx+1}</span>
                    <button onClick={() => removeItem(idx)} className="text-xs text-red-600 hover:bg-red-50 px-2 py-1 rounded"><Trash2 className="w-3 h-3 inline mr-1" />Remove</button>
                  </div>
                  {contentType === "coding" ? (
                    <div className="space-y-2">
                      <input value={it.title||""} onChange={(e)=>updateItem(idx,{title:e.target.value})} placeholder="Title" className="w-full border border-slate-200 rounded-lg px-2 py-1 text-sm text-slate-900 placeholder:text-slate-400" />
                      <textarea value={it.description||""} onChange={(e)=>updateItem(idx,{description:e.target.value})} placeholder="Description" rows={2} className="w-full border border-slate-200 rounded-lg px-2 py-1 text-sm text-slate-900 placeholder:text-slate-400" />
                      <div className="grid grid-cols-2 gap-2">
                        <input value={it.language||""} onChange={(e)=>updateItem(idx,{language:e.target.value})} placeholder="java" className="w-full border rounded px-2 py-1 text-xs text-slate-900" />
                        <select value={it.difficulty||"easy"} onChange={(e)=>updateItem(idx,{difficulty:e.target.value})} className="w-full border rounded px-2 py-1 text-xs text-slate-900 bg-white">
                          <option value="easy">easy</option><option value="medium">medium</option><option value="hard">hard</option>
                        </select>
                      </div>
                      <textarea value={it.starter_code||""} onChange={(e)=>updateItem(idx,{starter_code:e.target.value})} placeholder="Starter code" rows={3} className="w-full border rounded px-2 py-1 text-xs font-mono text-slate-900" />
                      <textarea value={it.solution_code||""} onChange={(e)=>updateItem(idx,{solution_code:e.target.value})} placeholder="Solution code" rows={3} className="w-full border rounded px-2 py-1 text-xs font-mono text-slate-900" />
                    </div>
                  ) : contentType === "pyq" ? (
                    <div className="space-y-2">
                      <textarea value={it.question||""} onChange={(e)=>updateItem(idx,{question:e.target.value})} rows={2} placeholder="Question" className="w-full border rounded px-2 py-1 text-sm text-slate-900" />
                      <textarea value={it.solution||""} onChange={(e)=>updateItem(idx,{solution:e.target.value})} rows={3} placeholder="Solution" className="w-full border rounded px-2 py-1 text-sm text-slate-900" />
                      <input type="number" value={it.marks||0} onChange={(e)=>updateItem(idx,{marks:parseInt(e.target.value)||0})} placeholder="Marks" className="w-24 border rounded px-2 py-1 text-xs text-slate-900" />
                    </div>
                  ) : contentType === "predict_output" ? (
                    <div className="space-y-2">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div>
                          <label className="text-[11px] font-semibold text-slate-600 block mb-1">Set Title</label>
                          <input value={it.title||""} onChange={(e)=>updateItem(idx,{title:e.target.value})} placeholder="e.g. Loop Tracing & Conditionals" className="w-full border border-slate-200 rounded-lg px-2 py-1.5 text-sm text-slate-900" />
                        </div>
                        <div>
                          <label className="text-[11px] font-semibold text-slate-600 block mb-1">Topic</label>
                          <input value={it.topic||""} onChange={(e)=>updateItem(idx,{topic:e.target.value})} placeholder="e.g. Loops & Control Flow" className="w-full border border-slate-200 rounded-lg px-2 py-1.5 text-sm text-slate-900" />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[11px] font-semibold text-slate-600 block mb-1">Difficulty</label>
                          <select value={it.difficulty||"Easy"} onChange={(e)=>updateItem(idx,{difficulty:e.target.value})} className="w-full border rounded-lg px-2 py-1.5 text-xs text-slate-900 bg-white">
                            <option value="Easy">Easy</option><option value="Medium">Medium</option><option value="Hard">Hard</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-[11px] font-semibold text-slate-600 block mb-1">Question Count</label>
                          <input value={it.question_count||"10 Questions"} onChange={(e)=>updateItem(idx,{question_count:e.target.value})} placeholder="e.g. 12 Questions" className="w-full border rounded-lg px-2 py-1.5 text-xs text-slate-900" />
                        </div>
                      </div>
                      <div>
                        <label className="text-[11px] font-semibold text-slate-600 block mb-1">Code Snippet to Trace</label>
                        <textarea value={it.code_snippet||""} onChange={(e)=>updateItem(idx,{code_snippet:e.target.value})} placeholder="Code snippet..." rows={4} className="w-full border rounded-lg px-2.5 py-2 text-xs font-mono text-emerald-400 bg-slate-900" />
                      </div>
                      <div>
                        <label className="text-[11px] font-semibold text-slate-600 block mb-1">Expected Console Output</label>
                        <textarea value={it.expected_output||""} onChange={(e)=>updateItem(idx,{expected_output:e.target.value})} placeholder="Expected output string" rows={2} className="w-full border rounded-lg px-2.5 py-1.5 text-xs font-mono text-slate-900 bg-slate-100" />
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <textarea value={it.question||""} onChange={(e)=>updateItem(idx,{question:e.target.value})} rows={2} placeholder="Question" className="w-full border rounded px-2 py-1 text-sm text-slate-900" />
                      {(it.options||[]).map((opt:string, oi:number)=>(
                        <div key={oi} className="flex gap-2 items-center">
                          <span className="text-xs font-bold w-5">{String.fromCharCode(65+oi)}</span>
                          <input value={opt} onChange={(e)=>{ const n=[...(it.options||[])]; n[oi]=e.target.value; updateItem(idx,{options:n}); }} className="flex-1 border rounded px-2 py-1 text-sm text-slate-900" />
                          <input type="radio" name={`correct-${idx}`} checked={it.correct_index===oi} onChange={()=>updateItem(idx,{correct_index:oi})} title="Correct" />
                        </div>
                      ))}
                      <textarea value={it.explanation||""} onChange={(e)=>updateItem(idx,{explanation:e.target.value})} placeholder="Explanation" rows={2} className="w-full border rounded px-2 py-1 text-xs text-slate-900" />
                      <div className="flex gap-2">
                        <select value={it.difficulty||"easy"} onChange={(e)=>updateItem(idx,{difficulty:e.target.value})} className="border rounded px-2 py-1 text-xs text-slate-900 bg-white"><option value="easy">easy</option><option value="medium">medium</option><option value="hard">hard</option></select>
                        <input value={it.topic||""} onChange={(e)=>updateItem(idx,{topic:e.target.value})} placeholder="Topic" className="flex-1 border rounded px-2 py-1 text-xs text-slate-900" />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <p className="flex-1">{error}</p>
              </div>
            )}
            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
              <button onClick={()=>{setPreviewItems(null); setError(null);}} className="text-sm text-slate-600 hover:text-slate-800">← Back</button>
              <div className="flex gap-2">
                <button onClick={close} disabled={saving} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-xl">Cancel</button>
                <button onClick={handleSaveEdited} disabled={saving} className="flex items-center gap-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-semibold px-5 py-2 rounded-xl text-sm shadow-md">
                  {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</> : <><CheckCircle2 className="w-4 h-4" /> Save {previewItems.length} items</>}
                </button>
              </div>
            </div>
          </div>
        ) : !mode ? (
          <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setMode("write")}
              className="p-5 rounded-2xl border border-slate-200 hover:border-orange-400 hover:bg-orange-50/40 text-left transition-colors"
            >
              <FileText className="w-6 h-6 text-orange-500 mb-2" />
              <p className="font-semibold text-slate-800">Write structured text</p>
              <p className="text-xs text-slate-500 mt-1">Paste or type your questions / exercises. The AI will parse and save them.</p>
            </button>
            <button
              type="button"
              onClick={() => setMode("pdf")}
              className="p-5 rounded-2xl border border-slate-200 hover:border-orange-400 hover:bg-orange-50/40 text-left transition-colors"
            >
              <FileUp className="w-6 h-6 text-orange-500 mb-2" />
              <p className="font-semibold text-slate-800">Upload PDF</p>
              <p className="text-xs text-slate-500 mt-1">Upload a question paper or notes PDF. The AI extracts the structured content.</p>
            </button>
          </div>
        ) : (
          <form
            onSubmit={(e) => { e.preventDefault(); handleParse(); }}
            className="p-6 space-y-4 max-h-[80vh] overflow-y-auto"
          >
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <button type="button" onClick={() => { setMode(null); setError(null); }} className="hover:text-orange-600">← Back</button>
              <span>·</span>
              <span>{mode === "write" ? "Structured text" : "PDF upload"}</span>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                {subjectLabel}
              </label>
              <input
                type="text"
                placeholder={subjectHint}
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                required
                className="w-full border border-slate-200 rounded-xl px-3.5 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-400"
              />
            </div>

            {contentType === "quiz" && (
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                  Quiz Title (optional — AI will infer if blank)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Java OOP Mastery Quiz"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3.5 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-400"
                />
              </div>
            )}

            {mode === "write" ? (
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                  Content
                </label>
                <textarea
                  rows={10}
                  placeholder={
                    contentType === "quiz"
                      ? "Paste questions like:\nQ1. What does OOP stand for?\nA) Object Oriented Programming  B) Open Object Program  C) Other  D) None\nAnswer: A\n\nQ2. ..."
                      : contentType === "mcq"
                      ? "Paste MCQs in any format; the AI extracts question, options, correct answer, and explanation."
                      : contentType === "coding"
                      ? "Describe each coding problem: title, description, starter code, solution code, test cases."
                      : "Paste past year questions with their model answers and marks."
                  }
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  required
                  className="w-full border border-slate-200 rounded-xl px-3.5 py-2 text-sm font-mono text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-400"
                />
              </div>
            ) : (
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                  PDF File
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="application/pdf"
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                  required
                  className="block w-full text-sm text-slate-900 file:mr-3 file:rounded-xl file:border-0 file:bg-orange-500 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-orange-600"
                />
                {file && (
                  <p className="text-xs text-slate-900 mt-2">
                    Selected: <span className="font-medium text-slate-900">{file.name}</span> ({(file.size / 1024).toFixed(1)} KB)
                  </p>
                )}
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <p className="flex-1">{error}</p>
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={close}
                disabled={submitting}
                className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-xl transition-colors font-medium disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-semibold px-5 py-2 rounded-xl text-sm transition-colors shadow-md shadow-orange-500/20"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    AI parsing…
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Parse with AI
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
