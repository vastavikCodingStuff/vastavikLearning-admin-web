"use client";

import React, { useState } from "react";
import { Check, Copy, Terminal, Code2 } from "lucide-react";

interface MarkdownMessageProps {
  content: string;
  className?: string;
}

export function MarkdownMessage({ content, className = "" }: MarkdownMessageProps) {
  if (!content) return null;

  // Split content by code blocks: ```lang\n...\n```
  const codeBlockRegex = /```([a-zA-Z0-9_-]*)\n?([\s\S]*?)```/g;
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  let blockIdx = 0;
  while ((match = codeBlockRegex.exec(content)) !== null) {
    // Content before this code block
    if (match.index > lastIndex) {
      const textBefore = content.substring(lastIndex, match.index);
      parts.push(
        <div key={`text-${blockIdx}-${lastIndex}`} className="space-y-2">
          {renderTextContent(textBefore)}
        </div>
      );
    }

    const language = (match[1] || "code").trim().toLowerCase();
    const codeContent = match[2] ? match[2].trimEnd() : "";

    parts.push(
      <CodeBlock
        key={`code-${blockIdx}-${match.index}`}
        language={language}
        code={codeContent}
      />
    );

    lastIndex = match.index + match[0].length;
    blockIdx++;
  }

  // Content after the last code block
  if (lastIndex < content.length) {
    const remainingText = content.substring(lastIndex);
    parts.push(
      <div key={`text-final-${lastIndex}`} className="space-y-2">
        {renderTextContent(remainingText)}
      </div>
    );
  }

  return <div className={`text-sm leading-relaxed space-y-3 ${className}`}>{parts}</div>;
}

function CodeBlock({ language, code }: { language: string; code: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  const displayLang = language.toUpperCase() || "CODE";

  return (
    <div className="my-3 rounded-xl overflow-hidden border border-slate-700/80 bg-slate-950 shadow-md">
      {/* Code block header */}
      <div className="flex items-center justify-between px-3.5 py-1.5 bg-slate-900/90 border-b border-slate-800 text-xs text-slate-400 select-none">
        <div className="flex items-center gap-1.5 font-mono text-[11px] tracking-wider text-slate-300">
          <Terminal className="w-3.5 h-3.5 text-orange-400" />
          <span>{displayLang}</span>
        </div>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 text-[11px] px-2 py-0.5 rounded hover:bg-slate-800 text-slate-300 hover:text-white transition-colors"
          title="Copy code"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-400 font-medium">Copied</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5 text-slate-400" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>

      {/* Code content */}
      <pre className="p-3.5 text-xs sm:text-[13px] font-mono leading-relaxed text-emerald-300 dark:text-emerald-300 bg-slate-950 overflow-x-auto selection:bg-orange-500 selection:text-white">
        <code>{code}</code>
      </pre>
    </div>
  );
}

function renderTextContent(text: string): React.ReactNode[] {
  const lines = text.split("\n");
  const nodes: React.ReactNode[] = [];

  let listItems: React.ReactNode[] = [];
  let isNumbered = false;

  const flushList = (keyPrefix: string) => {
    if (listItems.length > 0) {
      if (isNumbered) {
        nodes.push(
          <ol key={`${keyPrefix}-ol`} className="list-decimal list-inside space-y-1 my-1.5 pl-1">
            {listItems}
          </ol>
        );
      } else {
        nodes.push(
          <ul key={`${keyPrefix}-ul`} className="space-y-1.5 my-1.5">
            {listItems}
          </ul>
        );
      }
      listItems = [];
      isNumbered = false;
    }
  };

  lines.forEach((rawLine, idx) => {
    const line = rawLine.trim();

    if (!line) {
      flushList(`flush-${idx}`);
      return;
    }

    // Headers
    if (line.startsWith("### ")) {
      flushList(`h3-${idx}`);
      nodes.push(
        <h4 key={`h3-${idx}`} className="font-bold text-sm text-orange-600 dark:text-orange-400 mt-3 mb-1">
          {renderInlineFormatting(line.slice(4))}
        </h4>
      );
      return;
    }

    if (line.startsWith("## ")) {
      flushList(`h2-${idx}`);
      nodes.push(
        <h3 key={`h2-${idx}`} className="font-bold text-base text-slate-900 dark:text-white mt-3.5 mb-1.5 border-b border-slate-100 dark:border-slate-800 pb-1">
          {renderInlineFormatting(line.slice(3))}
        </h3>
      );
      return;
    }

    if (line.startsWith("# ")) {
      flushList(`h1-${idx}`);
      nodes.push(
        <h2 key={`h1-${idx}`} className="font-extrabold text-lg text-slate-900 dark:text-white mt-4 mb-2">
          {renderInlineFormatting(line.slice(2))}
        </h2>
      );
      return;
    }

    // Blockquote
    if (line.startsWith("> ")) {
      flushList(`quote-${idx}`);
      nodes.push(
        <blockquote
          key={`quote-${idx}`}
          className="border-l-4 border-orange-500 bg-orange-50 dark:bg-orange-950/20 text-slate-700 dark:text-slate-200 px-3 py-1.5 my-2 rounded-r italic text-xs sm:text-sm"
        >
          {renderInlineFormatting(line.slice(2))}
        </blockquote>
      );
      return;
    }

    // Unordered list item (- or *)
    const bulletMatch = line.match(/^[-*]\s+(.*)$/);
    if (bulletMatch) {
      if (isNumbered) flushList(`switch-${idx}`);
      isNumbered = false;
      listItems.push(
        <li key={`li-${idx}`} className="flex items-start gap-2 text-slate-700 dark:text-slate-200">
          <span className="w-1.5 h-1.5 rounded-full bg-orange-500 mt-2 flex-shrink-0" />
          <span className="flex-1">{renderInlineFormatting(bulletMatch[1])}</span>
        </li>
      );
      return;
    }

    // Numbered list item (1. )
    const numMatch = line.match(/^(\d+)\.\s+(.*)$/);
    if (numMatch) {
      if (!isNumbered && listItems.length > 0) flushList(`switch-num-${idx}`);
      isNumbered = true;
      listItems.push(
        <li key={`num-li-${idx}`} className="text-slate-700 dark:text-slate-200">
          {renderInlineFormatting(numMatch[2])}
        </li>
      );
      return;
    }

    // Normal paragraph
    flushList(`p-${idx}`);
    nodes.push(
      <p key={`p-${idx}`} className="text-slate-700 dark:text-slate-200">
        {renderInlineFormatting(line)}
      </p>
    );
  });

  flushList("end");
  return nodes;
}

function renderInlineFormatting(text: string): React.ReactNode {
  // Parses `inline code`, **bold**, *italic*
  const parts: React.ReactNode[] = [];
  const regex = /(`[^`]+`)|(\*{2}[^*]+\*{2})|(\*[^*]+\*)/g;
  let lastIdx = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIdx) {
      parts.push(text.substring(lastIdx, match.index));
    }

    const token = match[0];
    if (token.startsWith("`") && token.endsWith("`")) {
      // Inline code
      parts.push(
        <code
          key={`inline-code-${match.index}`}
          className="px-1.5 py-0.5 rounded text-xs font-mono font-medium bg-slate-200/80 dark:bg-slate-800 text-orange-600 dark:text-orange-400 border border-slate-300/60 dark:border-slate-700"
        >
          {token.slice(1, -1)}
        </code>
      );
    } else if (token.startsWith("**") && token.endsWith("**")) {
      // Bold
      parts.push(
        <strong key={`bold-${match.index}`} className="font-bold text-slate-900 dark:text-white">
          {token.slice(2, -2)}
        </strong>
      );
    } else if (token.startsWith("*") && token.endsWith("*")) {
      // Italic
      parts.push(
        <em key={`italic-${match.index}`} className="italic text-slate-800 dark:text-slate-200">
          {token.slice(1, -1)}
        </em>
      );
    }

    lastIdx = match.index + token.length;
  }

  if (lastIdx < text.length) {
    parts.push(text.substring(lastIdx));
  }

  return parts.length > 0 ? parts : text;
}
