"use client";

import { CheckCircle2, AlertTriangle } from "lucide-react";

export function PlanningHeader({
  activeSection,
  onSectionChange,
  workflowStatus
}: {
  activeSection: string;
  onSectionChange: (section: "overview" | "architecture" | "tasks" | "review") => void;
  workflowStatus: string;
}) {
  const isApproved = workflowStatus === "READY_FOR_EXECUTION" || workflowStatus === "EXECUTING";

  return (
    <div className="glass shrink-0 border-b border-slate-200 dark:border-white/10 px-6 py-4 flex flex-wrap items-center justify-between gap-4 sticky top-0 z-20">
      <div className="flex items-center gap-6">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-3 text-slate-900 dark:text-white">
            PLAN
            {isApproved ? (
              <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20 uppercase">
                Approved ✓
              </span>
            ) : (
              <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 uppercase flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" />
                Generating
              </span>
            )}
          </h2>
        </div>
        
        <div className="hidden md:flex bg-slate-100 dark:bg-slate-900/50 p-1 rounded-lg border border-slate-200 dark:border-slate-800">
          {(["overview", "architecture", "tasks", "review"] as const).map(section => (
            <button
              key={section}
              onClick={() => onSectionChange(section)}
              className={`px-4 py-1.5 text-sm font-bold rounded-md transition-all capitalize ${
                activeSection === section 
                  ? "bg-white dark:bg-slate-800 text-blue-600 dark:text-white shadow-sm border-slate-200 dark:border-slate-700 border" 
                  : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300 border border-transparent"
              }`}
            >
              {section}
            </button>
          ))}
        </div>
      </div>
      
      <div className="text-sm font-medium text-slate-500 flex gap-4">
        <span>8 requirements</span>
        <span>·</span>
        <span>5 components</span>
        <span>·</span>
        <span>12 tasks</span>
      </div>
    </div>
  );
}
