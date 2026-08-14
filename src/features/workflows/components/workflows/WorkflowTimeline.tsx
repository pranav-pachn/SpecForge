"use client";

import React from "react";
import { WorkflowStatus } from "@prisma/client";
import { Check, Circle, AlertTriangle, X, Play } from "lucide-react";

interface WorkflowTimelineProps {
  status: WorkflowStatus;
  artifacts?: any[];
}

type StageState = 'DONE' | 'RUNNING' | 'PENDING' | 'STALE' | 'FAILED';

export function WorkflowTimeline({ status, artifacts = [] }: WorkflowTimelineProps) {
  // Ordered sequence of macro stages
  const STAGES = [
    { id: 'spec', label: 'Specification', artifacts: ['SPEC'] },
    { id: 'plan', label: 'Planning', artifacts: ['PLAN'] },
    { id: 'tasks', label: 'Tasks', artifacts: ['TASKS'] },
    { id: 'execute', label: 'Execute', artifacts: ['CODE', 'EXECUTION_PACK'] },
    { id: 'review', label: 'Review', artifacts: ['REVIEW_REPORT'] },
    { id: 'validate', label: 'Validate', artifacts: ['VALIDATION_REPORT'] }
  ];

  // Map backend detailed status to the active macro stage index
  const getActiveStageIndex = (): number => {
    switch (status) {
      case 'DRAFT':
      case 'CLARIFYING':
      case 'SPEC_REVIEW': return 0;
      case 'PLANNING':
      case 'WAITING_FOR_APPROVAL': return 1;
      case 'TASK_BREAKDOWN': return 2;
      case 'EXECUTING': return 3;
      case 'ENGINEERING_REVIEW':
      case 'REVIEWING': return 4;
      case 'VALIDATING': return 5;
      case 'COMPLETED':
      case 'ARCHIVED': return 6; // All done
      default: return 0;
    }
  };

  const activeIndex = getActiveStageIndex();

  const getStageState = (index: number, stage: typeof STAGES[0]): StageState => {
    // 1. Check if any relevant artifact for this stage is STALE or FAILED
    const relevantArtifacts = artifacts.filter(a => stage.artifacts.includes(a.type));
    const hasStale = relevantArtifacts.some(a => a.versions?.[0]?.status === 'STALE');
    const hasFailed = relevantArtifacts.some(a => a.versions?.[0]?.status === 'REJECTED' || a.versions?.[0]?.status === 'FAILED');

    if (hasFailed) return 'FAILED';
    if (hasStale) return 'STALE';

    // 2. Derive state from current active index
    if (index < activeIndex) return 'DONE';
    if (index === activeIndex) return 'RUNNING';
    return 'PENDING';
  };

  const StateIcon = ({ state }: { state: StageState }) => {
    switch (state) {
      case 'DONE': return <Check className="w-4 h-4 text-green-500" />;
      case 'RUNNING': return <Play className="w-4 h-4 text-blue-500 fill-blue-500 animate-pulse" />;
      case 'STALE': return <AlertTriangle className="w-4 h-4 text-orange-500" />;
      case 'FAILED': return <X className="w-4 h-4 text-red-500" />;
      case 'PENDING':
      default: return <Circle className="w-4 h-4 text-slate-300 dark:text-slate-700" />;
    }
  };

  const StateLabel = ({ state }: { state: StageState }) => {
    switch (state) {
      case 'DONE': return <span className="text-green-600 dark:text-green-400">Approved</span>;
      case 'RUNNING': return <span className="text-blue-600 dark:text-blue-400">In progress</span>;
      case 'STALE': return <span className="text-orange-600 dark:text-orange-400">Stale</span>;
      case 'FAILED': return <span className="text-red-600 dark:text-red-400">Failed</span>;
      case 'PENDING':
      default: return <span className="text-slate-400 dark:text-slate-600">Waiting</span>;
    }
  };

  return (
    <div className="flex items-center w-full justify-between py-6 px-4 bg-white/40 dark:bg-slate-900/40 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 backdrop-blur-sm overflow-x-auto">
      <div className="flex items-center min-w-max mx-auto">
        {STAGES.map((stage, idx) => {
          const state = getStageState(idx, stage);
          const isLast = idx === STAGES.length - 1;

          return (
            <React.Fragment key={stage.id}>
              {/* Stage Node */}
              <div className="flex flex-col items-center gap-2 w-28 group">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 shadow-sm transition-transform group-hover:scale-110">
                  <StateIcon state={state} />
                </div>
                <div className="text-center">
                  <div className={`text-sm font-bold ${state === 'PENDING' ? 'text-slate-400' : 'text-slate-900 dark:text-slate-100'}`}>
                    {stage.label}
                  </div>
                  <div className="text-[10px] font-semibold tracking-wider uppercase mt-0.5">
                    <StateLabel state={state} />
                  </div>
                </div>
              </div>

              {/* Connecting Line */}
              {!isLast && (
                <div className="flex-1 w-12 sm:w-20 md:w-24 h-[2px] -mt-10 mx-2 relative overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
                  {/* Fill line if the previous stage is DONE (so we are moving past it) */}
                  {(state === 'DONE' || state === 'STALE') && (
                    <div className="absolute inset-0 bg-slate-300 dark:bg-slate-700 w-full" />
                  )}
                  {state === 'RUNNING' && (
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/50 to-transparent w-full animate-pulse" />
                  )}
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}
