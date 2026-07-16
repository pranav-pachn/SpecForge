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
        <div className="absolute left-4 right-4 top-1/2 -translate-y-1/2 h-0.5 bg-white/10 rounded-full" />
        
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
                  "w-8 h-8 rounded-full flex items-center justify-center border-2 bg-[#0a0a14] transition-all duration-300 shadow-sm",
                  isCompleted ? "border-blue-500 bg-blue-600 text-white shadow-[0_0_15px_rgba(59,130,246,0.3)]" : 
                  isCurrent ? "border-blue-500 text-blue-400 ring-4 ring-blue-500/20" : 
                  "border-white/10 text-slate-500 hover:border-white/20"
                )}
              >
                {isCompleted ? <Check className="w-4 h-4" /> :
                 isCurrent ? <CircleDot className="w-4 h-4" /> :
                 <Circle className="w-3 h-3" />}
              </div>
              <div className="absolute top-10 w-28 text-center pointer-events-none">
                <span className={cn(
                  "text-[10px] sm:text-xs font-semibold uppercase tracking-wider transition-colors duration-300",
                  isCurrent ? "text-blue-400" : 
                  isCompleted ? "text-slate-300" :
                  "text-slate-600"
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
