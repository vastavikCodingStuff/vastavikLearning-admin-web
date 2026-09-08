"use client";

import { useState, useRef } from "react";
import { X, FileText, FileUp, Sparkles, Loader2, CheckCircle2, AlertTriangle } from "lucide-react";
import api from "@/lib/api";
import { cn } from "@/lib/utils";

type ContentType = "quiz" | "coding" | "mcq" | "pyq";

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
  const [result, setResult] = useState<{ count: number; set_id?: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const reset = () => {
    setMode(null);
    setSubject("");
    setTitle("");
    setText("");
    setFile(null);
    setSubmitting(false);
    setResult(null);
    setError(null);
  };

  const close = () => {
    if (submitting) return;
    reset();
    onClose();
  };

  const submit = async () => {
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
    try {
      if (mode === "write") {
        const resp = await api.post(`/admin/practice/ingest`, {
          content_type: contentType,
          subject: subject.trim(),
          title: title.trim() || undefined,
          text: text.trim(),
        });
        setResult({ count: resp.data.created_count ?? 0, set_id: resp.data.set_id });
        onCreated?.({ count: resp.data.created_count ?? 0, set_id: resp.data.set_id });
      } else {
        // PDF: use FormData (multipart) so we don't need to base64 in the browser
        const fd = new FormData();
        fd.append("content_type", contentType);
        fd.append("subject", subject.trim());
        if (title.trim()) fd.append("title", title.trim());
        fd.append("file", file as File);
        const resp = await api.post(`/admin/practice/ingest/upload`, fd, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        setResult({ count: resp.data.created_count ?? 0, set_id: resp.data.set_id });
        onCreated?.({ count: resp.data.created_count ?? 0, set_id: resp.data.set_id });
      }
    } catch (err: unknown) {
      const e = err as { response?: { data?: { detail?: string; message?: string } } };
      setError(e?.response?.data?.detail ?? e?.response?.data?.message ?? "Ingest failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const heading = TITLES[contentType].heading;
  const sub = TITLES[contentType].sub;
  const subjectLabel = TITLES[contentType].subjectLabel;
  const subjectHint = TITLES[contentType].subjectHint;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto animate-fadeIn">
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl border border-slate-100 overflow-hidden my-8">
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
            <h3 className="text-lg font-bold text-slate-800">AI parsed and saved!</h3>
            <p className="text-sm text-slate-500 mt-1">
              {result.count} {contentType === "coding" ? "exercise" : "question"}{result.count === 1 ? "" : "s"} added
              {result.set_id ? ` to set ${result.set_id.slice(0, 8)}…` : ""}.
            </p>
            <button onClick={close} className="mt-6 bg-orange-500 hover:bg-orange-600 text-white font-semibold px-5 py-2 rounded-xl text-sm transition-colors">
              Done
            </button>
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
            onSubmit={(e) => { e.preventDefault(); submit(); }}
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
                className="w-full border border-slate-200 rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
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
                  className="w-full border border-slate-200 rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
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
                  className="w-full border border-slate-200 rounded-xl px-3.5 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-orange-400"
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
                  className="block w-full text-sm text-slate-700 file:mr-3 file:rounded-xl file:border-0 file:bg-orange-500 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-orange-600"
                />
                {file && (
                  <p className="text-xs text-slate-500 mt-2">
                    Selected: <span className="font-medium">{file.name}</span> ({(file.size / 1024).toFixed(1)} KB)
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
                className={cn(
                  "flex items-center gap-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-semibold px-5 py-2 rounded-xl text-sm transition-colors shadow-md shadow-orange-500/20"
                )}
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    AI parsing…
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Run AI & save
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
