"use client";

import React from "react";
import { getWorkflowPipeline } from "@/features/dashboard/utils/workflowPipeline";
import { TabId } from "@/features/workflows/components/workflows/WorkflowTabs";

interface CurrentStageProps {
  workflow: any;
  activeTab: TabId;
}

const TAB_DESCRIPTIONS: Record<string, string> = {
  spec: "Define the core requirements and feature specification.",
  clarify: "Refine and clarify ambiguous requirements before planning.",
  plan: "Break down the specification into a high-level implementation plan.",
  architecture: "Design the component boundaries and system architecture.",
  tasks: "Turn the approved architecture into dependency-aware implementation tasks.",
  execute: "Agents are executing the plan.",
  review: "Reviewing requirement coverage and architecture alignment.",
  validate: "Proving acceptance criteria and checking for drift."
};

export function CurrentStage({ workflow, activeTab }: CurrentStageProps) {
  const pipeline = getWorkflowPipeline(workflow);
  const activeStage = pipeline.find(s => s.status === 'RUNNING' || s.status === 'BLOCKED') || pipeline.find(s => s.status === 'STALE') || pipeline[0];
  
  const isIntelligenceTab = ['knowledge', 'memory', 'graph', 'traceability', 'timeline'].includes(activeTab);
  
  if (isIntelligenceTab) {
    return (
      <div className="mb-8">
        <h2 className="text-[10px] font-bold text-purple-500 uppercase tracking-widest mb-2">INTELLIGENCE TOOL</h2>
        <h3 className="text-2xl font-bold text-slate-900 dark:text-white capitalize">
          {activeTab}
        </h3>
      </div>
    );
  }

  // Calculate some dynamic stats based on the tab
  let stats = null;
  
  if (activeTab === 'tasks') {
    const taskCount = workflow.tasks?.length || 0;
    const completedTasks = workflow.tasks?.filter((t: any) => t.status === 'DONE').length || 0;
    const reqCount = workflow.artifacts?.find((a: any) => a.type === "SPEC")?.versions?.[0]?.content?.match(/- \*\*.+?:/g)?.length || 0;
    
    stats = (
      <div className="flex flex-col gap-1 mt-4 text-sm font-medium text-slate-600 dark:text-slate-400">
        <div><strong className="text-slate-900 dark:text-white">{taskCount}</strong> tasks generated</div>
        <div><strong className="text-slate-900 dark:text-white">{completedTasks}</strong> tasks completed</div>
        {reqCount > 0 && <div><strong className="text-slate-900 dark:text-white">{reqCount}</strong> requirements covered</div>}
      </div>
    );
  } else if (activeTab === 'spec') {
    const specContent = workflow.artifacts?.find((a: any) => a.type === "SPEC")?.versions?.[0]?.content || "";
    // Count main sections or requirements
    const reqCount = (specContent.match(/## /g) || []).length;
    const isApproved = workflow.status !== 'DRAFT' && workflow.status !== 'SPEC_REVIEW';
    
    stats = (
      <div className="flex flex-col gap-1 mt-4 text-sm font-medium text-slate-600 dark:text-slate-400">
        {isApproved ? (
          <div><strong className="text-slate-900 dark:text-white">Specification Approved</strong></div>
        ) : reqCount > 0 ? (
          <div><strong className="text-slate-900 dark:text-white">Drafting Specification</strong> · {reqCount} sections defined</div>
        ) : (
          <div>Awaiting requirements extraction</div>
        )}
      </div>
    );
  }

  return (
    <div className="mb-8">
      <h2 className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">CURRENT STAGE</h2>
      <h3 className="text-2xl font-bold text-slate-900 dark:text-white uppercase tracking-tight mb-2">
        {activeTab.replace('_', ' ')}
      </h3>
      <p className="text-slate-600 dark:text-slate-400 text-sm max-w-2xl">
        {TAB_DESCRIPTIONS[activeTab] || "Working on the current stage of the pipeline."}
      </p>
      
      {stats}
      
      <div className="mt-8 border-t border-slate-200 dark:border-white/10 w-full" />
    </div>
  );
}
