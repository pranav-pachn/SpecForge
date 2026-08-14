"use client";

import { X, ExternalLink, Link2, GitCommit, FileText, CheckCircle2, ChevronRight } from "lucide-react";
import { useState } from "react";
import { ExecutionPackPreview } from "../execution/ExecutionPackPreview";

export function TaskDetails({ task, onClose }: { task: any; onClose: () => void }) {
  const [showExecutionPack, setShowExecutionPack] = useState(false);

  if (!task) return null;

  if (showExecutionPack) {
    return <ExecutionPackPreview task={task} onClose={() => setShowExecutionPack(false)} onFullClose={onClose} />;
  }

  // Fallback to basic string parsing if it wasn't parsed as array
  let requirements = [];
  if (Array.isArray(task.requirements)) {
    requirements = task.requirements;
  } else if (typeof task.requirements === 'string') {
    requirements = task.requirements.split('\n').filter((x: string) => x.trim().length > 0);
  }

  let acceptanceCriteria = [];
  if (Array.isArray(task.acceptanceCriteria)) {
    acceptanceCriteria = task.acceptanceCriteria;
  } else if (typeof task.acceptanceCriteria === 'string') {
    acceptanceCriteria = task.acceptanceCriteria.split('\n').filter((x: string) => x.trim().length > 0);
  }

  return (
    <div className="bg-white dark:bg-[#0f111a] border border-slate-200 dark:border-white/10 rounded-xl flex flex-col h-full shadow-lg">
      <div className="p-4 border-b border-slate-200 dark:border-white/10 flex justify-between items-start sticky top-0 bg-white/80 dark:bg-[#0f111a]/80 backdrop-blur z-10">
        <div>
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{task.id}</span>
          <h3 className="font-bold text-slate-900 dark:text-white mt-1 leading-tight">{task.title}</h3>
          <div className="flex items-center gap-2 mt-3">
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" />
              {task.status}
            </span>
          </div>
        </div>
        <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-6">
        <div>
          <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 border-b border-slate-100 dark:border-white/5 pb-2">Task Details</h4>
          <div className="space-y-4">
            <div>
              <div className="text-xs text-slate-500 mb-1 flex items-center gap-1.5"><FileText className="w-3.5 h-3.5" /> Description</div>
              <div className="text-sm font-medium text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-slate-900 px-3 py-2 rounded-lg border border-slate-100 dark:border-white/5 whitespace-pre-wrap">
                {task.description || 'No description provided.'}
              </div>
            </div>
            
            {requirements.length > 0 && (
              <div>
                <div className="text-xs text-slate-500 mb-1 flex items-center gap-1.5"><Link2 className="w-3.5 h-3.5" /> Requirements</div>
                <div className="text-sm font-medium text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-slate-900 px-3 py-2 rounded-lg border border-slate-100 dark:border-white/5 flex flex-col gap-1">
                  {requirements.map((req: string, idx: number) => (
                    <span key={idx} className="block">{req}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {task.dependencies && task.dependencies.length > 0 && (
          <div>
            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 border-b border-slate-100 dark:border-white/5 pb-2">Dependencies</h4>
            <div className="flex flex-wrap gap-2">
              {task.dependencies.map((dep: any) => (
                <span key={dep.dependsOnId} className="text-xs font-bold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
                  {dep.dependsOn?.title || dep.dependsOnId}
                </span>
              ))}
            </div>
          </div>
        )}

        <div>
          <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 border-b border-slate-100 dark:border-white/5 pb-2">Acceptance Criteria</h4>
          <div className="space-y-2">
            {acceptanceCriteria.length > 0 ? acceptanceCriteria.map((crit: string, idx: number) => (
              <div key={idx} className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-slate-300 dark:text-slate-600 shrink-0 mt-0.5" />
                <span className="text-sm text-slate-700 dark:text-slate-300">{crit}</span>
              </div>
            )) : <span className="text-sm text-slate-500 italic">No acceptance criteria specified.</span>}
          </div>
        </div>
      </div>

      <div className="p-4 border-t border-slate-200 dark:border-white/10 shrink-0 bg-slate-50 dark:bg-[#05050a] rounded-b-xl">
        <button
          onClick={() => setShowExecutionPack(true)}
          className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg transition-all hover:-translate-y-0.5"
        >
          Open Execution Pack <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
