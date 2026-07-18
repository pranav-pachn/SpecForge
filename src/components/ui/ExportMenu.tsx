"use client";

import { Download, FileText, File } from "lucide-react";
import { useExport } from "@/hooks/useExport";
import { useState } from "react";
import ReactMarkdown from "react-markdown";

interface ExportMenuProps {
  /** Full markdown content to export */
  content: string;
  /** Base filename (no extension) */
  filename: string;
}

export function ExportMenu({ content, filename }: ExportMenuProps) {
  const [open, setOpen] = useState(false);
  const { exportAsMarkdown, exportAsPDF, isExporting } = useExport();
  const hiddenId = `pdf-export-${filename.replace(/[^a-zA-Z0-9]/g, '')}`;

  return (
    <div className="relative">
      <div style={{ position: "absolute", left: "-9999px", top: 0 }}>
        <div id={hiddenId} className="bg-white p-10 prose prose-sm max-w-none text-slate-800 prose-headings:text-slate-900 prose-headings:font-bold prose-headings:tracking-tight prose-a:text-blue-500 prose-img:rounded-xl">
          <ReactMarkdown>{content}</ReactMarkdown>
        </div>
      </div>

      <button
        onClick={() => setOpen(!open)}
        className="px-3 py-1.5 flex items-center gap-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-600 transition-colors shadow-sm"
        title="Export"
      >
        <Download className="w-4 h-4" />
        <span className="hidden sm:inline">Export</span>
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
          />
          <div className="absolute right-0 top-full mt-2 w-52 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2">
            <div className="px-3 py-2 border-b border-slate-100 dark:border-white/5">
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Export Workflow</p>
            </div>
            <button
              onClick={() => {
                if (!content) return;
                exportAsMarkdown(content, filename);
                setOpen(false);
              }}
              disabled={!content}
              className="w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-slate-100 dark:hover:bg-white/5 text-sm font-medium transition-colors border-b border-slate-100 dark:border-white/5 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <FileText className="w-4 h-4 text-blue-500" />
              <div>
                <div>Markdown (.md)</div>
                <div className="text-[10px] text-slate-400">Full spec + plan</div>
              </div>
            </button>
            <button
              onClick={() => {
                if (!content) return;
                exportAsPDF(hiddenId, filename);
                setOpen(false);
              }}
              disabled={isExporting || !content}
              className="w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-slate-100 dark:hover:bg-white/5 text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <File className="w-4 h-4 text-red-500" />
              <div>
                <div>{isExporting ? "Generating..." : "PDF (.pdf)"}</div>
                <div className="text-[10px] text-slate-400">Styled document</div>
              </div>
            </button>
          </div>
        </>
      )}
    </div>
  );
}
