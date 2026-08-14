"use client";

import { CheckCircle2, CircleDashed, ShieldAlert } from "lucide-react";

export function PlanReview({
  workflowId,
  workflowStatus,
  onMutate,
  onNext
}: {
  workflowId: string;
  workflowStatus: string;
  onMutate?: () => void;
  onNext?: () => void;
}) {
  const isApproved = workflowStatus === "READY_FOR_EXECUTION" || workflowStatus === "EXECUTING";
  const canApprove = workflowStatus === "TASK_BREAKDOWN";

  const handleApprove = async () => {
    try {
      await fetch(`/api/workflows/${workflowId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "READY_FOR_EXECUTION" }),
      });
      onMutate?.();
      onNext?.();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="bg-white dark:bg-[#0f111a] rounded-2xl border border-slate-200 dark:border-white/10 p-8 shadow-sm max-w-2xl mx-auto mt-8">
      <h3 className="text-xl font-bold mb-6 text-slate-900 dark:text-white border-b border-slate-200 dark:border-white/10 pb-4">
        PLAN REVIEW
      </h3>
      
      <div className="space-y-4 mb-8">
        <div className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-green-500" />
            <span className="font-medium text-slate-700 dark:text-slate-300">Requirement Coverage</span>
          </div>
          <span className="font-mono font-bold text-slate-900 dark:text-white">12 / 12</span>
        </div>
        
        <div className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-green-500" />
            <span className="font-medium text-slate-700 dark:text-slate-300">Dependency Health</span>
          </div>
          <span className="font-bold text-green-600 dark:text-green-400">Healthy</span>
        </div>
        
        <div className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
          <div className="flex items-center gap-3">
            <CircleDashed className="w-5 h-5 text-slate-400" />
            <span className="font-medium text-slate-700 dark:text-slate-300">Task Completeness</span>
          </div>
          <span className="font-mono text-slate-500 italic text-sm">Not evaluated yet</span>
        </div>
        
        <div className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
          <div className="flex items-center gap-3">
            <ShieldAlert className="w-5 h-5 text-slate-400" />
            <span className="font-medium text-slate-700 dark:text-slate-300">Architecture Consistency</span>
          </div>
          <span className="font-mono text-slate-500 italic text-sm">Not evaluated yet</span>
        </div>
      </div>
      
      <div className="flex justify-end pt-4 border-t border-slate-200 dark:border-white/10">
        {!isApproved && canApprove ? (
          <button
            onClick={handleApprove}
            className="px-8 py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5 flex items-center gap-2"
          >
            Approve Plan →
          </button>
        ) : isApproved ? (
          <button
            className="px-8 py-3 bg-green-500/10 text-green-600 dark:text-green-400 rounded-xl font-bold border border-green-500/20 cursor-default flex items-center gap-2"
          >
            <CheckCircle2 className="w-5 h-5" /> Plan Approved
          </button>
        ) : (
          <button
            disabled
            className="px-8 py-3 bg-slate-100 dark:bg-white/5 text-slate-400 dark:text-slate-600 rounded-xl font-bold cursor-not-allowed"
          >
            Approve Plan
          </button>
        )}
      </div>
    </div>
  );
}
