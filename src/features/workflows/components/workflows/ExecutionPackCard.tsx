import { useState } from "react";
import { Download, Copy, CheckCircle2, Terminal } from "lucide-react";
import { ToolName } from "@prisma/client";

interface ExecutionPackCardProps {
  task: any;
  pack: any;
  onGenerate: (taskId: string) => Promise<void>;
  isGenerating: boolean;
}

export default function ExecutionPackCard({ task, pack, onGenerate, isGenerating }: ExecutionPackCardProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (!pack?.content) return;
    navigator.clipboard.writeText(pack.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExport = () => {
    if (!pack?.content) return;
    const blob = new Blob([pack.content], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `task-${task.order + 1}-${pack.toolName.toLowerCase()}-pack.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-white dark:bg-slate-900 border rounded-xl shadow-sm overflow-hidden flex flex-col">
      <div className="bg-slate-50 dark:bg-slate-950 border-b px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
            Task {task.order + 1}
          </span>
          <h3 className="font-bold text-slate-800 dark:text-slate-200">{task.title}</h3>
        </div>
        {pack && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 mr-2 flex items-center gap-1">
              <Terminal className="w-3 h-3" />
              {pack.toolName}
            </span>
            <button
              onClick={handleCopy}
              className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded transition-colors"
              title="Copy Prompt"
            >
              {copied ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
            </button>
            <button
              onClick={handleExport}
              className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded transition-colors"
              title="Export as Markdown"
            >
              <Download className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      <div className="p-4">
        {pack ? (
          <div className="bg-slate-900 text-slate-300 p-4 rounded-lg text-sm font-mono overflow-auto max-h-[300px] whitespace-pre-wrap">
            {pack.content}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center p-8 text-slate-500 border-2 border-dashed rounded-xl">
            <p className="mb-4">No execution pack generated for this task yet.</p>
            <button
              onClick={() => onGenerate(task.id)}
              disabled={isGenerating}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 text-sm font-medium"
            >
              {isGenerating ? "Generating..." : "Generate Pack"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
