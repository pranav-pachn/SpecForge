"use client";

import { ArrowLeft, Play, Copy, Terminal, ShieldAlert, Code2, Beaker, FileText, X } from "lucide-react";
import { toast } from "sonner";

export function ExecutionPackPreview({ task, onClose, onFullClose }: { task: any, onClose: () => void, onFullClose: () => void }) {
  
  const handleCopy = () => {
    navigator.clipboard.writeText(`Execute task: ${task.title}\nContext: ${task.requirement}\nConstraints: Server-side sessions, Rate limiting`);
    toast.success("Copied to clipboard");
  };

  return (
    <div className="bg-white dark:bg-[#0f111a] border border-blue-500/30 rounded-xl flex flex-col h-full shadow-[0_0_30px_rgba(59,130,246,0.1)] relative">
      <div className="absolute inset-0 bg-gradient-to-b from-blue-500/5 to-transparent pointer-events-none rounded-xl" />
      
      <div className="p-4 border-b border-slate-200 dark:border-white/10 flex justify-between items-start sticky top-0 bg-white/80 dark:bg-[#0f111a]/80 backdrop-blur z-10">
        <div>
          <button onClick={onClose} className="text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-slate-300 flex items-center gap-1 mb-2">
            <ArrowLeft className="w-3 h-3" /> Back to details
          </button>
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-blue-500" />
            <h3 className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-sm">Execution Pack</h3>
          </div>
          <div className="text-xs text-slate-500 mt-1">{task.id}: {task.title}</div>
        </div>
        <button onClick={onFullClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-6 relative z-10">
        
        <div>
          <h4 className="text-[10px] font-bold text-blue-500 uppercase tracking-widest mb-2 flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5" /> Context
          </h4>
          <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 p-3 rounded-lg text-sm text-slate-700 dark:text-slate-300 font-mono">
            <div>REQ-03</div>
            <div>Spec v3</div>
          </div>
        </div>

        <div>
          <h4 className="text-[10px] font-bold text-purple-500 uppercase tracking-widest mb-2 flex items-center gap-1.5">
            <Code2 className="w-3.5 h-3.5" /> Architecture
          </h4>
          <div className="bg-purple-50 dark:bg-purple-900/10 border border-purple-100 dark:border-purple-900/30 p-3 rounded-lg text-sm text-slate-700 dark:text-slate-300 font-mono">
            AuthService → OAuthProvider
          </div>
        </div>

        <div>
          <h4 className="text-[10px] font-bold text-orange-500 uppercase tracking-widest mb-2 flex items-center gap-1.5">
            <ShieldAlert className="w-3.5 h-3.5" /> Constraints
          </h4>
          <div className="bg-orange-50 dark:bg-orange-900/10 border border-orange-100 dark:border-orange-900/30 p-3 rounded-lg text-sm text-slate-700 dark:text-slate-300 font-mono">
            <ul className="list-disc pl-4 space-y-1">
              <li>Server-side sessions</li>
              <li>Rate limiting</li>
              <li>Audit logging</li>
            </ul>
          </div>
        </div>

        <div>
          <h4 className="text-[10px] font-bold text-green-500 uppercase tracking-widest mb-2 flex items-center gap-1.5">
            <Beaker className="w-3.5 h-3.5" /> Test Expectations
          </h4>
          <div className="bg-green-50 dark:bg-green-900/10 border border-green-100 dark:border-green-900/30 p-3 rounded-lg text-sm text-slate-700 dark:text-slate-300 font-mono">
            3 tests required (Unit + Integration)
          </div>
        </div>

        <div>
          <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-1.5">
            <Terminal className="w-3.5 h-3.5" /> Agent Tools
          </h4>
          <div className="flex gap-2">
            <span className="text-xs font-mono bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded text-slate-600 dark:text-slate-400">GitHub</span>
            <span className="text-xs font-mono bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded text-slate-600 dark:text-slate-400">Filesystem</span>
            <span className="text-xs font-mono bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded text-slate-600 dark:text-slate-400">Database</span>
          </div>
        </div>

      </div>

      <div className="p-4 border-t border-slate-200 dark:border-white/10 shrink-0 bg-slate-50 dark:bg-[#05050a] rounded-b-xl space-y-3 z-10 relative">
        <button
          onClick={handleCopy}
          className="w-full py-2.5 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-lg font-bold flex items-center justify-center gap-2 transition-all"
        >
          <Copy className="w-4 h-4" /> Copy to Cursor
        </button>
        <button
          className="w-full py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-lg font-bold flex items-center justify-center gap-2 shadow-lg transition-all hover:-translate-y-0.5"
        >
          <Play className="w-4 h-4 fill-white" /> Execute with Agent
        </button>
      </div>
    </div>
  );
}
