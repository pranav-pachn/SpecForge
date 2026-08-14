"use client";

import React from "react";
import { Database, Network, Brain, FileText, ChevronRight } from "lucide-react";

interface ContextPanelProps {
  workflowId: string;
}

export function ContextPanel({ workflowId }: ContextPanelProps) {
  // We will mock an empty state for now as requested: "No fake intelligence."
  // If the backend had data, we would fetch it. Here we establish the UI contract.
  const hasDecisions = false;
  const hasMemory = false;
  const hasSources = false;
  const hasDependencies = false;

  return (
    <div className="w-full h-full flex flex-col bg-slate-50 dark:bg-[#0f111a]/80 border-l border-slate-200 dark:border-white/5 p-5 overflow-y-auto">
      <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-6">Context</h3>
      
      <div className="space-y-6">
        {/* Decisions */}
        <div>
          <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-2">
            <Network className="w-3.5 h-3.5 text-blue-500" /> Decisions
          </h4>
          {hasDecisions ? (
            <div className="text-sm text-slate-600 dark:text-slate-400">
              {/* Would map decisions here */}
            </div>
          ) : (
            <p className="text-xs text-slate-400 dark:text-slate-600 italic">No decisions yet.</p>
          )}
        </div>
        
        {/* Memory */}
        <div>
          <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-2">
            <Brain className="w-3.5 h-3.5 text-purple-500" /> Memory
          </h4>
          {hasMemory ? (
            <div className="text-sm text-slate-600 dark:text-slate-400">
              {/* Would map memories here */}
            </div>
          ) : (
            <p className="text-xs text-slate-400 dark:text-slate-600 italic">No relevant memory context.</p>
          )}
        </div>

        {/* Sources */}
        <div>
          <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-2">
            <Database className="w-3.5 h-3.5 text-emerald-500" /> Sources
          </h4>
          {hasSources ? (
            <div className="text-sm text-slate-600 dark:text-slate-400">
              {/* Would map sources here */}
            </div>
          ) : (
            <p className="text-xs text-slate-400 dark:text-slate-600 italic">No sources attached.</p>
          )}
        </div>

        {/* Dependencies */}
        <div>
          <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-2">
            <FileText className="w-3.5 h-3.5 text-orange-500" /> Dependencies
          </h4>
          {hasDependencies ? (
            <div className="text-sm text-slate-600 dark:text-slate-400">
              {/* Would map dependencies here */}
            </div>
          ) : (
            <p className="text-xs text-slate-400 dark:text-slate-600 italic">No known dependencies.</p>
          )}
        </div>
      </div>
    </div>
  );
}
