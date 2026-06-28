import { WorkflowStatus } from "@prisma/client";
import { WORKFLOW_PIPELINE_STAGES, WORKFLOW_STATUS_LABELS } from "@/lib/constants";
import { Check, CircleDot, Circle } from "lucide-react";
import { cn } from "@/lib/utils";

export default function PipelineStages({ currentStatus }: { currentStatus: WorkflowStatus }) {
  const currentIndex = WORKFLOW_PIPELINE_STAGES.indexOf(currentStatus as any);

  return (
    <div className="w-full py-8">
      <div className="relative flex items-center justify-between px-4">
        {/* Background track line */}
        <div className="absolute left-4 right-4 top-1/2 -translate-y-1/2 h-0.5 bg-slate-200 dark:bg-slate-800 rounded-full" />
        
        {/* Progress line */}
        <div 
          className="absolute left-4 top-1/2 -translate-y-1/2 h-0.5 bg-blue-600 rounded-full transition-all duration-700 ease-in-out" 
          style={{ width: `calc(${(currentIndex / (WORKFLOW_PIPELINE_STAGES.length - 1)) * 100}% - 32px)` }} 
        />

        {WORKFLOW_PIPELINE_STAGES.map((stage, idx) => {
          const isCompleted = idx < currentIndex;
          const isCurrent = idx === currentIndex;
          const isUpcoming = idx > currentIndex;

          return (
            <div key={stage} className="relative flex flex-col items-center group z-10" title={WORKFLOW_STATUS_LABELS[stage]}>
              {/* Pulse effect for current stage */}
              {isCurrent && (
                <div className="absolute inset-0 bg-blue-400 rounded-full animate-ping opacity-20" style={{ transform: 'scale(1.5)' }} />
              )}
              
              <div 
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center border-2 bg-white dark:bg-slate-950 transition-all duration-300 shadow-sm",
                  isCompleted ? "border-blue-600 bg-blue-600 text-white" : 
                  isCurrent ? "border-blue-600 text-blue-600 ring-4 ring-blue-50 dark:ring-blue-900/20" : 
                  "border-slate-300 dark:border-slate-700 text-slate-400 hover:border-slate-400"
                )}
              >
                {isCompleted ? <Check className="w-4 h-4" /> :
                 isCurrent ? <CircleDot className="w-4 h-4" /> :
                 <Circle className="w-3 h-3" />}
              </div>
              <div className="absolute top-10 w-28 text-center pointer-events-none">
                <span className={cn(
                  "text-[10px] sm:text-xs font-semibold uppercase tracking-wider transition-colors duration-300",
                  isCurrent ? "text-blue-600 dark:text-blue-400" : 
                  isCompleted ? "text-slate-700 dark:text-slate-300" :
                  "text-slate-400 dark:text-slate-600"
                )}>
                  {WORKFLOW_STATUS_LABELS[stage]}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
