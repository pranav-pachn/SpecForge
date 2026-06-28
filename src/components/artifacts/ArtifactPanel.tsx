import ReactMarkdown from "react-markdown";
import { VERSION_STATUS_COLORS } from "@/lib/constants";
import { ArtifactVersionStatus } from "@prisma/client";
import { Loader2, RefreshCw, CheckCircle2, Save, FileText, Sparkles, LayoutTemplate, Keyboard } from "lucide-react";
import { useEffect, useState } from "react";

interface ArtifactPanelProps {
  title: string;
  status: ArtifactVersionStatus;
  versionNumber: number;
  content: string;
  isEditing?: boolean;
  onContentChange?: (content: string) => void;
  onSaveDraft?: () => void;
  onApprove?: () => void;
  onRegenerate?: () => void;
  onToggleEdit?: () => void;
  isLoading?: boolean;
  emptyStateMessage?: string;
  completenessLabel?: string;
  sourceLabel?: string;
}

// Simple diff helper for MVP
function renderDiff(current: string, previous: string = "") {
  const currentLines = current.split("\n");
  const previousLines = previous.split("\n");
  
  return (
    <div className="font-mono text-sm space-y-1 bg-slate-950 text-slate-300 p-4 rounded-md overflow-x-auto">
      {currentLines.map((line, i) => {
        if (!previousLines.includes(line)) {
          return <div key={i} className="text-green-400 bg-green-400/10 px-2 py-0.5 rounded">+ {line}</div>;
        }
        return <div key={i} className="text-slate-500 px-2 py-0.5">  {line}</div>;
      })}
    </div>
  );
}

export default function ArtifactPanel({
  title,
  status,
  versionNumber,
  content,
  isEditing = false,
  onContentChange,
  onSaveDraft,
  onApprove,
  onRegenerate,
  onToggleEdit,
  isLoading = false,
  emptyStateMessage = "No content available yet.",
  completenessLabel,
  sourceLabel,
}: ArtifactPanelProps) {
  const isDraftOrReview = status === "DRAFT" || status === "NEEDS_REVIEW";
  const [showDiff, setShowDiff] = useState(false);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + S to Save
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        if (isEditing && onSaveDraft) {
          e.preventDefault();
          onSaveDraft();
        }
      }
      // Ctrl/Cmd + Enter to Approve
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        if (isDraftOrReview && onApprove) {
          e.preventDefault();
          onApprove();
        }
      }
      // Escape to toggle edit/preview
      if (e.key === 'Escape') {
        if (onToggleEdit) {
          e.preventDefault();
          onToggleEdit();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isEditing, onSaveDraft, isDraftOrReview, onApprove, onToggleEdit]);
  
  return (
    <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm flex flex-col h-full min-h-[600px] overflow-hidden relative">
      <div className="sticky top-0 z-10 border-b border-slate-200 dark:border-slate-800 px-6 py-4 flex flex-wrap items-center justify-between gap-4 shrink-0 bg-white/95 dark:bg-slate-950/95 backdrop-blur-md">
        <div className="flex items-center gap-4">
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2">
              <LayoutTemplate className="w-5 h-5 text-blue-500" />
              {title}
            </h2>
            <div className="flex items-center gap-3 mt-1.5">
              <span className="text-sm text-slate-500 font-medium">v{versionNumber}</span>
              <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium shadow-sm ${VERSION_STATUS_COLORS[status]}`}>
                {status.replace("_", " ")}
              </span>
              {completenessLabel && (
                <span className="text-xs bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 px-2.5 py-0.5 rounded-full font-medium">
                  {completenessLabel}
                </span>
              )}
              {sourceLabel && (
                <span className="text-xs bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300 px-2.5 py-0.5 rounded-full font-medium uppercase tracking-wider">
                  {sourceLabel}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onToggleEdit && (
            <button
              onClick={onToggleEdit}
              title="Esc"
              className="px-3 py-1.5 text-sm font-medium text-slate-600 bg-white border border-slate-300 rounded-md hover:bg-slate-50 dark:bg-slate-900 dark:text-slate-300 dark:border-slate-700 transition-colors"
            >
              {isEditing ? "Preview" : "Edit"}
            </button>
          )}

          {isEditing && onSaveDraft && (
            <button
              onClick={onSaveDraft}
              title="Cmd/Ctrl + S"
              disabled={isLoading}
              className="px-3 py-1.5 flex items-center gap-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 transition-colors"
            >
              <Save className="w-4 h-4" /> Save Draft
            </button>
          )}

          {onRegenerate && (
            <button
              onClick={onRegenerate}
              disabled={isLoading}
              className="px-3 py-1.5 flex items-center gap-2 text-sm font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-md dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-900/50 transition-colors"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              Regenerate
            </button>
          )}

          {isDraftOrReview && onApprove && (
            <button
              onClick={onApprove}
              title="Cmd/Ctrl + Enter"
              disabled={isLoading}
              className="px-4 py-1.5 flex items-center gap-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-md shadow-sm transition-colors"
            >
              <CheckCircle2 className="w-4 h-4" /> Approve
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Main Content Area */}
        <div className="flex-1 p-0 overflow-y-auto bg-white dark:bg-slate-950 relative">
          {!content && !isEditing ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-400 p-8 animate-in">
              <div className="w-20 h-20 bg-blue-50 dark:bg-blue-900/20 rounded-full flex items-center justify-center mb-6">
                <Sparkles className="w-10 h-10 text-blue-500 animate-pulse" />
              </div>
              <h3 className="text-xl font-semibold text-slate-700 dark:text-slate-200 mb-2">Ready to Forge</h3>
              <p className="text-md text-slate-500 mb-8 max-w-sm text-center">{emptyStateMessage}</p>
              {onRegenerate && (
                <button
                  onClick={onRegenerate}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium flex items-center gap-2 shadow-sm hover:shadow transition-all"
                >
                  <RefreshCw className="w-4 h-4" /> Generate AI Draft
                </button>
              )}
            </div>
          ) : showDiff && !isEditing ? (
            <div className="p-8 animate-in">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                  <FileText className="w-4 h-4" /> Changes since last version
                </h3>
                <button onClick={() => setShowDiff(false)} className="text-sm text-blue-600 hover:underline">Exit Diff View</button>
              </div>
              {renderDiff(content)}
            </div>
          ) : isEditing ? (
            <textarea
              value={content}
              onChange={(e) => onContentChange && onContentChange(e.target.value)}
              className="w-full h-full p-8 resize-none outline-none font-mono text-sm leading-relaxed bg-slate-50 dark:bg-slate-900/50 dark:text-slate-300"
              placeholder="Start typing markdown..."
            />
          ) : (
            <div className="p-8 animate-in">
              <article className="prose prose-lg prose-slate max-w-[800px] mx-auto dark:prose-invert prose-headings:font-bold prose-headings:tracking-tight prose-a:text-blue-600 prose-img:rounded-xl">
                <ReactMarkdown>{content}</ReactMarkdown>
              </article>
            </div>
          )}
        </div>

        {/* Version History Stub sidebar */}
        <div className="w-72 border-l border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 p-5 shrink-0 overflow-y-auto">
          <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Version History</h3>
          <div className="space-y-3">
            <div className="flex flex-col gap-2 p-3.5 rounded-lg bg-white dark:bg-slate-800 border shadow-sm border-blue-200 dark:border-blue-800">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-sm">v{versionNumber}</span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">CURRENT</span>
              </div>
              <span className="text-xs text-slate-500">Latest changes</span>
              {versionNumber > 1 && !isEditing && (
                <button 
                  onClick={() => setShowDiff(!showDiff)}
                  className="mt-2 text-xs font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1"
                >
                  {showDiff ? "Hide Changes" : "Show Changes"}
                </button>
              )}
            </div>
            
            {/* Stub for older versions */}
            {versionNumber > 1 && (
              <div className="flex flex-col gap-1 p-3.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 border border-transparent cursor-pointer transition-colors opacity-70">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-sm text-slate-600 dark:text-slate-400">v{versionNumber - 1}</span>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-400">SUPERSEDED</span>
                </div>
                <span className="text-xs text-slate-500">Previous draft</span>
              </div>
            )}
          </div>
          
          <div className="mt-8 pt-4 border-t border-slate-200 dark:border-slate-800">
            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Shortcuts</h3>
            <div className="space-y-2 text-xs text-slate-500">
              <div className="flex justify-between items-center">
                <span>Save Draft</span>
                <kbd className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 font-mono">⌘S</kbd>
              </div>
              <div className="flex justify-between items-center">
                <span>Approve</span>
                <kbd className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 font-mono">⌘↵</kbd>
              </div>
              <div className="flex justify-between items-center">
                <span>Toggle Edit</span>
                <kbd className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 font-mono">Esc</kbd>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
