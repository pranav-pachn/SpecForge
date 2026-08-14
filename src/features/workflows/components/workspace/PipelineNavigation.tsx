"use client";

import React from "react";
import { Check, Circle, AlertTriangle, X, Play, Lock } from "lucide-react";
import { getWorkflowPipeline, PipelineStatus, PipelineStage } from "@/features/dashboard/utils/workflowPipeline";
import { TabId } from "@/features/workflows/components/workflows/WorkflowTabs";

interface PipelineNavigationProps {
  workflow: any;
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
}

const STAGE_TO_TAB: Record<PipelineStage, TabId | "drift"> = {
  SPEC: "spec",
  CLARIFY: "clarify",
  PLAN: "plan",
  EXECUTE: "execute",
  ENG_REVIEW: "eng-review",
  REVIEW: "review",
  VALIDATE: "validate",
  DRIFT: "drift"
};

export function PipelineNavigation({ workflow, activeTab, onTabChange }: PipelineNavigationProps) {
  const pipeline = getWorkflowPipeline(workflow);

  const StatusIcon = ({ status, isActive }: { status: PipelineStatus, isActive: boolean }) => {
    if (isActive) return <Circle className="w-3.5 h-3.5 text-blue-500 fill-blue-500" />;
    
    switch (status) {
      case 'DONE': return <Check className="w-3.5 h-3.5 text-green-500" />;
      case 'RUNNING': return <Play className="w-3.5 h-3.5 text-blue-500 fill-blue-500" />;
      case 'STALE': return <AlertTriangle className="w-3.5 h-3.5 text-orange-500" />;
      case 'FAILED': return <X className="w-3.5 h-3.5 text-red-500" />;
      case 'BLOCKED': return <AlertTriangle className="w-3.5 h-3.5 text-yellow-500" />;
      case 'PENDING':
      default: return <Circle className="w-3.5 h-3.5 text-slate-300 dark:text-slate-700" />;
    }
  };

  return (
    <div className="flex items-center w-full mb-2 overflow-x-auto scrollbar-hide py-3 glass px-4 rounded-xl">
      {pipeline.map((stage, idx) => {
        const tabId = STAGE_TO_TAB[stage.id];
        const isActive = activeTab === tabId;
        const isClickable = stage.status === 'DONE' || stage.status === 'RUNNING' || stage.status === 'STALE' || stage.status === 'FAILED' || stage.status === 'BLOCKED';
        
        return (
          <React.Fragment key={stage.id}>
            <button
              onClick={() => {
                if (isClickable && tabId !== "drift") onTabChange(tabId as TabId);
              }}
              disabled={!isClickable}
              data-testid={`nav-stage-${stage.id.toLowerCase()}`}
              className={`flex items-center gap-2 shrink-0 px-2 py-1.5 rounded-lg transition-all outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                isActive 
                  ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400' 
                  : isClickable 
                    ? 'hover:bg-slate-100 dark:hover:bg-white/5 cursor-pointer text-slate-700 dark:text-slate-300' 
                    : 'cursor-not-allowed opacity-50 text-slate-400 dark:text-slate-600'
              }`}
            >
              <StatusIcon status={stage.status} isActive={isActive} />
              <span className={`text-xs font-bold tracking-wide ${isActive ? '' : 'uppercase'}`}>
                {stage.label}
              </span>
            </button>
            
            {idx < pipeline.length - 1 && (
              <div className="w-4 sm:w-8 h-[2px] bg-slate-200 dark:bg-slate-800 mx-1 sm:mx-2 shrink-0 rounded-full">
                {(stage.status === 'DONE' || stage.status === 'STALE') && (
                  <div className="w-full h-full bg-slate-400 dark:bg-slate-500 rounded-full" />
                )}
              </div>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}
