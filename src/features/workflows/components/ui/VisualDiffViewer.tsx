"use client";

import React, { useEffect, useState } from "react";
import { Loader2, FileCode, CheckCircle2, AlertTriangle, GitPullRequest, Search, FileSymlink, Bot } from "lucide-react";

export interface FileStory {
  filePath: string;
  before: string;
  after: string;
  unifiedDiff: string;
  executionActions: string[];
  knowledgeUsed: string[];
  promptVersion: string;
  evaluationScore?: number;
  repairHistory: string[];
  confidence: number;
}

export function VisualDiffViewer({ workflowId }: { workflowId: string }) {
  const [diffs, setDiffs] = useState<FileStory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDiffs = async () => {
      try {
        const res = await fetch(`/api/workflows/${workflowId}/diff`);
        if (!res.ok) throw new Error("Failed to fetch diffs");
        const data = await res.json();
        setDiffs(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchDiffs();
  }, [workflowId]);

  if (loading) {
    return (
      <div className="glass-panel p-12 rounded-xl flex flex-col items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500 mb-4" />
        <p className="text-sm text-slate-400">Analyzing workspace changes...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass-panel p-12 rounded-xl border-red-500/20 flex flex-col items-center justify-center">
        <AlertTriangle className="w-8 h-8 text-red-400 mb-4" />
        <p className="text-red-400 font-medium">{error}</p>
      </div>
    );
  }

  if (diffs.length === 0) {
    return (
      <div className="glass-panel p-12 rounded-xl flex flex-col items-center justify-center text-slate-400">
        <CheckCircle2 className="w-12 h-12 text-slate-500 mb-4" />
        <p className="text-lg font-medium text-slate-300">No pending changes</p>
        <p className="text-sm mt-2 text-center max-w-sm">Workspace is clean. Autonomous execution has not modified any files yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-slate-200 flex items-center gap-2">
          <GitPullRequest className="w-5 h-5 text-blue-400" />
          Proposed Changes
        </h3>
        <div className="bg-slate-800/50 text-slate-300 text-xs px-3 py-1 rounded-full border border-white/5">
          {diffs.length} files modified
        </div>
      </div>

      <div className="space-y-6">
        {diffs.map((diff, idx) => (
          <div key={idx} className="glass-panel rounded-xl border border-white/10 overflow-hidden grid grid-cols-1 lg:grid-cols-3">
            {/* Left Col: Code Diff */}
            <div className="lg:col-span-2 border-b lg:border-b-0 lg:border-r border-white/10 flex flex-col">
              <div className="bg-black/40 px-4 py-3 flex items-center gap-3 border-b border-white/10">
                <FileCode className="w-4 h-4 text-slate-400" />
                <span className="text-sm font-mono text-slate-300">{diff.filePath}</span>
              </div>
              <div className="p-4 flex-1 bg-[#0d1117] overflow-x-auto text-sm font-mono">
                {diff.unifiedDiff ? (
                  <pre className="text-slate-300 leading-relaxed">
                    {diff.unifiedDiff.split('\n').map((line, i) => {
                      if (line.startsWith('+')) return <div key={i} className="text-green-400 bg-green-500/10 px-2 -mx-4">{line}</div>;
                      if (line.startsWith('-')) return <div key={i} className="text-red-400 bg-red-500/10 px-2 -mx-4">{line}</div>;
                      if (line.startsWith('@@')) return <div key={i} className="text-blue-400 bg-blue-500/10 px-2 -mx-4 my-2 opacity-75">{line}</div>;
                      return <div key={i} className="px-2 text-slate-400 opacity-60">{line}</div>;
                    })}
                  </pre>
                ) : (
                  <div className="text-slate-500 italic py-4 text-center">Empty diff or binary file</div>
                )}
              </div>
            </div>

            {/* Right Col: Reasoning / Story */}
            <div className="p-6 space-y-6 bg-slate-900/50">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2 mb-3">
                  <Search className="w-3 h-3" />
                  Why did this change?
                </h4>
                <div className="space-y-2">
                  {diff.executionActions.map((action, i) => (
                    <div key={i} className="text-sm text-slate-300 bg-black/20 p-3 rounded-lg border border-white/5">
                      {`"${action}"`}
                    </div>
                  ))}
                </div>
              </div>

              {diff.knowledgeUsed.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2 mb-3">
                    <FileSymlink className="w-3 h-3" />
                    Derived From
                  </h4>
                  <ul className="space-y-1.5 text-xs text-slate-400">
                    {diff.knowledgeUsed.map((kg, i) => (
                      <li key={i} className="flex items-center gap-2">
                        <span className="w-1 h-1 rounded-full bg-blue-500" />
                        {kg}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="pt-4 border-t border-white/10 space-y-4">
                <div>
                  <div className="text-xs text-slate-500 mb-1 flex items-center gap-1.5"><Bot className="w-3 h-3" /> Agent</div>
                  <div className="text-sm font-medium text-slate-300">Backend Execution Agent</div>
                </div>
                
                {diff.confidence && (
                  <div>
                    <div className="text-xs text-slate-500 mb-1 flex items-center gap-1.5"><CheckCircle2 className="w-3 h-3" /> Evaluation</div>
                    <div className="text-sm font-medium text-green-400">
                      Validation passed ({diff.confidence * 100}%)
                    </div>
                  </div>
                )}
                
                {diff.repairHistory.length > 0 && (
                  <div className="text-xs text-orange-400 bg-orange-500/10 p-2 rounded">
                    <strong>Repairs:</strong> {diff.repairHistory.join(', ')}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
