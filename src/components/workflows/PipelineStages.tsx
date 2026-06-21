import { WorkflowStatus } from "@prisma/client";
import { WORKFLOW_PIPELINE_STAGES, WORKFLOW_STATUS_LABELS } from "@/lib/constants";
import { Check, CircleDot, Circle } from "lucide-react";
import { cn } from "@/lib/utils";

export default function PipelineStages({ currentStatus }: { currentStatus: WorkflowStatus }) {
  const currentIndex = WORKFLOW_PIPELINE_STAGES.indexOf(currentStatus);

  return (
    <div className="w-full py-6">
      <div className="relative flex items-center justify-between">
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-0.5 bg-slate-200 dark:bg-slate-800" />
        
        <div 
          className="absolute left-0 top-1/2 -translate-y-1/2 h-0.5 bg-blue-600 transition-all duration-500 ease-in-out" 
          style={{ width: `${(currentIndex / (WORKFLOW_PIPELINE_STAGES.length - 1)) * 100}%` }} 
        />

        {WORKFLOW_PIPELINE_STAGES.map((stage, idx) => {
          const isCompleted = idx < currentIndex;
          const isCurrent = idx === currentIndex;
          const isUpcoming = idx > currentIndex;

          return (
            <div key={stage} className="relative flex flex-col items-center group">
              <div 
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center border-2 bg-white dark:bg-slate-950 transition-colors z-10",
                  isCompleted ? "border-blue-600 bg-blue-600 text-white" : 
                  isCurrent ? "border-blue-600 text-blue-600" : 
                  "border-slate-300 dark:border-slate-700 text-slate-400"
                )}
              >
                {isCompleted ? <Check className="w-4 h-4" /> :
                 isCurrent ? <CircleDot className="w-4 h-4" /> :
                 <Circle className="w-3 h-3" />}
              </div>
              <div className="absolute top-10 w-24 text-center">
                <span className={cn(
                  "text-[10px] sm:text-xs font-medium uppercase tracking-wider",
                  isCurrent ? "text-blue-600 dark:text-blue-400" : "text-slate-500 dark:text-slate-400"
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
