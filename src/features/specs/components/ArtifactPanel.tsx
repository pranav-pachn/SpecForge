import ReactMarkdown from "react-markdown";
import { VERSION_STATUS_COLORS } from "@/lib/constants";
import { ArtifactVersionStatus } from "@prisma/client";
import { Loader2, RefreshCw, CheckCircle2, Save, FileText, Sparkles, LayoutTemplate, History } from "lucide-react";
import { useEffect, useState } from "react";
import MonacoMarkdownEditor from "@/features/specs/components/editors/MonacoMarkdownEditor";
import { formatDistanceToNow } from "date-fns";

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
  artifactId?: string;
  onVersionSelect?: (version: any) => void;
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
  isLoading 
  = false,
  emptyStateMessage = "No content available yet.",
  completenessLabel,
  sourceLabel,
  artifactId,
  onVersionSelect,
}: ArtifactPanelProps) {
  const isDraftOrReview = status === "DRAFT" || status === "NEEDS_REVIEW";
  const [showDiff, setShowDiff] = useState(false);
  const [versions, setVersions] = useState<any[]>([]);
  const [loadingVersions, setLoadingVersions] = useState(false);

  useEffect(() => {
    if (artifactId) {
      const fetchVersions = async () => {
        setLoadingVersions(true);
        try {
          const res = await fetch(`/api/artifacts/${artifactId}/versions`);
          if (res.ok) {
            const data = await res.json();
            setVersions(data);
          }
        } catch (e) {
          console.error("Failed to fetch versions", e);
        } finally {
          setLoadingVersions(false);
        }
      };
      fetchVersions();
    }
  }, [artifactId, status]); // Refetch if status changes (meaning a new version was likely created or approved)

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
    <div className="glass-panel rounded-2xl flex flex-col h-full min-h-[600px] overflow-hidden relative">
      <div className="sticky top-0 z-10 border-b border-white/10 px-6 py-4 flex flex-wrap items-center justify-between gap-4 shrink-0 glass rounded-t-2xl">
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
              className="px-5 py-2 flex items-center gap-2 text-sm font-bold text-white bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 rounded-xl shadow-[0_0_15px_rgba(16,185,129,0.3)] transition-all duration-300 hover:shadow-[0_0_25px_rgba(16,185,129,0.5)] hover:-translate-y-0.5"
            >
              <CheckCircle2 className="w-4 h-4" /> Approve
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Main Content Area */}
        <div className="flex-1 p-0 overflow-y-auto bg-transparent relative">
          {!content && !isEditing ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-400 p-8 animate-in">
              <div className="w-24 h-24 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-full flex items-center justify-center mb-8 border border-white/5 shadow-[inset_0_0_30px_rgba(139,92,246,0.1)]">
                <Sparkles className="w-12 h-12 text-blue-400 animate-pulse drop-shadow-[0_0_15px_rgba(96,165,250,0.5)]" />
              </div>
              <h3 className="text-2xl font-extrabold text-white mb-3 tracking-tight">Ready to Forge</h3>
              <p className="text-md text-slate-400 mb-8 max-w-sm text-center leading-relaxed">{emptyStateMessage}</p>
              {onRegenerate && (
                <button
                  onClick={onRegenerate}
                  className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl font-bold flex items-center gap-2 shadow-[0_0_20px_rgba(79,70,229,0.3)] hover:shadow-[0_0_30px_rgba(79,70,229,0.5)] transition-all duration-300 hover:-translate-y-0.5"
                >
                  <RefreshCw className="w-5 h-5" /> Generate AI Draft
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
            <div className="flex h-full w-full">
              <div className="w-1/2 h-full border-r border-white/5 bg-[#0f111a]/50">
                <MonacoMarkdownEditor
                  value={content}
                  onChange={(val) => onContentChange && onContentChange(val || "")}
                  onSave={onSaveDraft}
                  readOnly={false}
                />
              </div>
              <div className="w-1/2 h-full overflow-y-auto bg-transparent p-8">
                <article className="prose prose-sm lg:prose-base max-w-none text-slate-300 prose-headings:text-white prose-headings:font-bold prose-headings:tracking-tight prose-a:text-blue-400 prose-img:rounded-xl">
                  <ReactMarkdown>{content}</ReactMarkdown>
                </article>
              </div>
            </div>
          ) : (
            <div className="p-8 animate-in h-full overflow-y-auto">
              <article className="prose prose-lg prose-slate max-w-[800px] mx-auto dark:prose-invert prose-headings:font-bold prose-headings:tracking-tight prose-a:text-blue-600 prose-img:rounded-xl">
                <ReactMarkdown>{content}</ReactMarkdown>
              </article>
            </div>
          )}
        </div>

        {/* Version History sidebar */}
        <div className="w-72 border-l border-white/5 bg-black/20 p-5 shrink-0 overflow-y-auto">
          <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
            <History className="w-3.5 h-3.5" /> Version History
          </h3>
          <div className="space-y-3">
            {loadingVersions ? (
              <div className="flex justify-center p-4"><Loader2 className="w-4 h-4 animate-spin text-slate-400" /></div>
            ) : versions.length > 0 ? (
              versions.map((v) => {
                const isCurrent = v.version === versions[0].version; // assuming first is latest
                const isViewing = v.version === versionNumber;
                return (
                  <div 
                    key={v.id}
                    onClick={() => {
                      if (!isViewing && onVersionSelect) {
                        onVersionSelect(v);
                      }
                    }}
                    className={`flex flex-col gap-2 p-3.5 rounded-xl border transition-all duration-300 ${
                      isViewing 
                        ? 'bg-blue-500/10 border-blue-500/30 shadow-[0_0_15px_rgba(59,130,246,0.15)] cursor-default glow-border' 
                        : 'bg-white/5 border-transparent hover:bg-white/10 hover:border-white/10 cursor-pointer'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-sm">v{v.version}</span>
                      {isCurrent ? (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">CURRENT</span>
                      ) : (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-400">{v.status}</span>
                      )}
                    </div>
                    <span className="text-xs text-slate-500">
                      {formatDistanceToNow(new Date(v.createdAt), { addSuffix: true })}
                    </span>
                    
                    {isViewing && !isEditing && v.version > 1 && (
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowDiff(!showDiff);
                        }}
                        className="mt-2 text-xs font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1"
                      >
                        {showDiff ? "Hide Changes" : "Show Changes"}
                      </button>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="text-xs text-slate-500 italic">No versions saved yet</div>
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
