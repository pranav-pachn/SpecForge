"use client";

import { Download, FileText, File } from "lucide-react";
import { useExport } from "@/hooks/useExport";
import { useState } from "react";

interface ExportMenuProps {
  content: string;
  filename: string;
  elementId: string;
}

export function ExportMenu({ content, filename, elementId }: ExportMenuProps) {
  const [open, setOpen] = useState(false);
  const { exportAsMarkdown, exportAsPDF, isExporting } = useExport();

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="px-3 py-1.5 flex items-center gap-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 dark:bg-slate-900 dark:text-slate-300 dark:border-slate-700 transition-colors"
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
          <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2">
            <button
              onClick={() => {
                exportAsMarkdown(content, filename);
                setOpen(false);
              }}
              className="w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-slate-100 dark:hover:bg-white/5 text-sm font-medium transition-colors border-b border-slate-100 dark:border-white/5"
            >
              <FileText className="w-4 h-4 text-blue-500" />
              Markdown (.md)
            </button>
            <button
              onClick={() => {
                exportAsPDF(elementId, filename);
                setOpen(false);
              }}
              disabled={isExporting}
              className="w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-slate-100 dark:hover:bg-white/5 text-sm font-medium transition-colors disabled:opacity-50"
            >
              <File className="w-4 h-4 text-red-500" />
              {isExporting ? "Generating..." : "PDF (.pdf)"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
