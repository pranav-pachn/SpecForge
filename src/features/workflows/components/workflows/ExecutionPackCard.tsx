import { useState, useMemo } from "react";
import { Download, Copy, CheckCircle2, Terminal, Code2, Bot, Layout, LayoutList } from "lucide-react";
import { ToolName } from "@prisma/client";

interface ExecutionPackCardProps {
  task: any;
  pack: any;
  onGenerate: (taskId: string) => Promise<void>;
  isGenerating: boolean;
}

export default function ExecutionPackCard({ task, pack, onGenerate, isGenerating }: ExecutionPackCardProps) {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "cursor" | "claude" | "windsurf">("overview");

  const parsedContent = useMemo(() => {
    if (!pack?.content) return null;
    try {
      return JSON.parse(pack.content);
    } catch (e) {
      return null;
    }
  }, [pack?.content]);

  const handleCopy = (textToCopy?: string) => {
    const text = textToCopy || pack?.content;
    if (!text) return;
    navigator.clipboard.writeText(text);
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
    <div className="glass border-white/10 border border-white/10 rounded-xl shadow-sm overflow-hidden flex flex-col">
      <div className="bg-slate-50 dark:bg-slate-950 border-b border-white/10 px-5 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <span className="text-xs font-bold text-slate-500 bg-slate-200 dark:bg-slate-800/80 px-2.5 py-1 rounded-md uppercase tracking-wide">
            Task {task.order + 1}
          </span>
          <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100">{task.title}</h3>
        </div>
        {pack && (
          <div className="flex items-center gap-3">
            <span className="text-xs font-medium text-slate-500 flex items-center gap-1.5 px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-md">
              <Terminal className="w-3.5 h-3.5" />
              {pack.toolName}
            </span>
            <button
              onClick={() => handleCopy()}
              className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-all"
              title="Copy JSON Payload"
            >
              {copied ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
            </button>
            <button
              onClick={handleExport}
              className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-all"
              title="Export as Markdown"
            >
              <Download className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      <div className="flex-1 bg-slate-50/50 dark:bg-slate-900/50">
        {pack ? (
          parsedContent ? (
            <div className="flex flex-col h-full">
              <div className="flex border-b border-white/10 px-4 glass border-white/10">
                <button 
                  onClick={() => setActiveTab("overview")}
                  className={`px-4 py-3 text-sm font-medium border-b-2 flex items-center gap-2 transition-colors ${activeTab === 'overview' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'}`}
                >
                  <LayoutList className="w-4 h-4" />
                  Overview
                </button>
                <button 
                  onClick={() => setActiveTab("cursor")}
                  className={`px-4 py-3 text-sm font-medium border-b-2 flex items-center gap-2 transition-colors ${activeTab === 'cursor' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'}`}
                >
                  <Code2 className="w-4 h-4" />
                  Cursor
                </button>
                <button 
                  onClick={() => setActiveTab("claude")}
                  className={`px-4 py-3 text-sm font-medium border-b-2 flex items-center gap-2 transition-colors ${activeTab === 'claude' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'}`}
                >
                  <Bot className="w-4 h-4" />
                  Claude Code
                </button>
                <button 
                  onClick={() => setActiveTab("windsurf")}
                  className={`px-4 py-3 text-sm font-medium border-b-2 flex items-center gap-2 transition-colors ${activeTab === 'windsurf' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'}`}
                >
                  <Terminal className="w-4 h-4" />
                  Windsurf
                </button>
              </div>
              
              <div className="p-6">
                {activeTab === "overview" && (
                  <div className="space-y-6">
                    {parsedContent.context && (
                      <div>
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Context</h4>
                        <p className="text-sm text-slate-300 glass border-white/10 p-4 rounded-xl border border-white/10">{parsedContent.context}</p>
                      </div>
                    )}
                    <div className="grid grid-cols-2 gap-6">
                      {parsedContent.requirements && (
                        <div>
                          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Requirements</h4>
                          <ul className="space-y-2">
                            {parsedContent.requirements.map((r: string, i: number) => (
                              <li key={i} className="text-sm text-slate-300 flex gap-2"><CheckCircle2 className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" /> <span>{r}</span></li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {parsedContent.constraints && (
                        <div>
                          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Constraints</h4>
                          <ul className="space-y-2">
                            {parsedContent.constraints.map((c: string, i: number) => (
                              <li key={i} className="text-sm text-slate-300 flex gap-2"><span className="w-1.5 h-1.5 rounded-full bg-orange-500 mt-1.5 shrink-0" /> <span>{c}</span></li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                    {parsedContent.tests && (
                      <div>
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Tests & Validation</h4>
                        <div className="bg-slate-100/50 dark:bg-slate-900/50 rounded-xl p-4 border border-white/10 space-y-2 text-sm text-slate-600 dark:text-slate-400">
                          {parsedContent.tests.map((t: string, i: number) => <div key={i}>• {t}</div>)}
                          {parsedContent.validation && parsedContent.validation.map((v: string, i: number) => <div key={`v-${i}`}>• {v}</div>)}
                        </div>
                      </div>
                    )}
                  </div>
                )}
                
                {activeTab !== "overview" && (
                  <div className="relative group">
                    <button 
                      onClick={() => handleCopy(parsedContent[`${activeTab}Prompt`] || parsedContent[`${activeTab}Prompt`])} 
                      className="absolute top-4 right-4 p-2 bg-slate-800 text-slate-300 hover:text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2 text-xs font-medium"
                    >
                      {copied ? <><CheckCircle2 className="w-3.5 h-3.5 text-green-400" /> Copied!</> : <><Copy className="w-3.5 h-3.5" /> Copy Prompt</>}
                    </button>
                    <pre className="bg-slate-950 text-slate-300 p-6 rounded-xl text-sm font-mono overflow-auto min-h-[200px] whitespace-pre-wrap border border-slate-800">
                      {parsedContent[`${activeTab}Prompt`] || "No specific prompt provided for this tool."}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-slate-950 text-slate-300 p-6 m-4 rounded-xl text-sm font-mono overflow-auto max-h-[400px] whitespace-pre-wrap">
              {pack.content}
            </div>
          )
        ) : (
          <div className="flex flex-col items-center justify-center p-12 text-slate-500 border-2 border-dashed border-white/10 rounded-xl m-6 glass border-white/10">
            <Bot className="w-12 h-12 mb-4 text-slate-300 dark:text-slate-700" />
            <p className="mb-6 font-medium">No execution pack generated for this task yet.</p>
            <button
              onClick={() => onGenerate(task.id)}
              disabled={isGenerating}
              className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm font-bold shadow-sm transition-all active:scale-95 flex items-center gap-2"
            >
              {isGenerating ? "Generating Payload..." : "Generate Pack Payload"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
