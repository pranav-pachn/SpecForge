"use client";

import React from "react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { ArrowRight, Check, Circle, AlertTriangle, X, Play } from "lucide-react";
import { getWorkflowPipeline, PipelineStatus } from "../utils/workflowPipeline";
import { WORKFLOW_STATUS_COLORS, WORKFLOW_STATUS_LABELS } from "@/shared/constants";
import { WorkflowStatus } from "@prisma/client";

interface WorkflowPipelineCardProps {
  workflow: any;
}

export function WorkflowPipelineCard({ workflow }: WorkflowPipelineCardProps) {
  const pipeline = getWorkflowPipeline(workflow);
  
  // Extract a short description from the Spec if available
  const specArtifact = workflow.artifacts?.find((a: any) => a.type === "SPEC");
  const specContent = specArtifact?.versions?.[0]?.content || "";
  const firstSentence = specContent.split("\n").find((l: string) => l.trim().length > 10 && !l.startsWith("#")) || workflow.name;
  const description = firstSentence.length > 80 ? firstSentence.substring(0, 80) + "..." : firstSentence;

  // Derive some counts
  const reqCount = specContent.match(/- \*\*.+?:/g)?.length || specContent.match(/- \[ \]/g)?.length || 0;
  const taskCount = workflow.tasks?.length || 0;
  const hasStale = pipeline.some(s => s.status === 'STALE');

  const StatusIcon = ({ status }: { status: PipelineStatus }) => {
    switch (status) {
      case 'DONE': return <Check className="w-3 h-3 text-green-500" />;
      case 'RUNNING': return <Play className="w-3 h-3 text-blue-500 fill-blue-500" />;
      case 'STALE': return <AlertTriangle className="w-3 h-3 text-orange-500" />;
      case 'FAILED': return <X className="w-3 h-3 text-red-500" />;
      case 'PENDING':
      default: return <Circle className="w-3 h-3 text-slate-300 dark:text-slate-700" />;
    }
  };

  return (
    <Link 
      href={`/workflow/${workflow.id}`} 
      className={`glass rounded-2xl p-6 hover:bg-slate-50 dark:hover:bg-white/5 transition-all duration-300 group flex flex-col relative overflow-hidden hover:-translate-y-1 hover:shadow-[0_10px_40px_-10px_rgba(59,130,246,0.15)] dark:hover:shadow-[0_10px_40px_-10px_rgba(59,130,246,0.2)] ${hasStale ? 'border-orange-500/30' : 'hover:border-blue-500/30'}`}
    >
      {hasStale && (
        <div className="absolute top-0 right-0 w-1.5 h-full bg-gradient-to-b from-orange-400 to-red-500 shadow-[0_0_15px_rgba(249,115,22,0.5)]" title="Contains stale artifacts" />
      )}
      
      <div className="flex justify-between items-start mb-3 gap-4">
        <h3 className="font-extrabold text-xl leading-tight line-clamp-1 text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
          {workflow.name}
        </h3>
        <span className={`text-[10px] uppercase tracking-wider px-2.5 py-1 rounded-full font-bold whitespace-nowrap shadow-sm border ${WORKFLOW_STATUS_COLORS[workflow.status as WorkflowStatus]} ${workflow.status === 'COMPLETED' ? 'border-green-200 dark:border-green-800' : 'border-transparent'}`}>
          {WORKFLOW_STATUS_LABELS[workflow.status as WorkflowStatus]}
        </span>
      </div>
      
      <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 line-clamp-1">
        {description}
      </p>
      
      {/* Visual Pipeline */}
      <div className="flex items-center w-full mb-6 py-2 overflow-x-auto scrollbar-hide">
        {pipeline.map((stage, idx) => (
          <React.Fragment key={stage.id}>
            <div className="flex items-center gap-1.5 shrink-0">
              <StatusIcon status={stage.status} />
              <span className={`text-[11px] font-bold tracking-wide uppercase ${
                stage.status === 'DONE' ? 'text-slate-700 dark:text-slate-300' :
                stage.status === 'RUNNING' ? 'text-blue-600 dark:text-blue-400' :
                stage.status === 'STALE' ? 'text-orange-600 dark:text-orange-400' :
                stage.status === 'FAILED' ? 'text-red-600 dark:text-red-400' :
                'text-slate-400 dark:text-slate-600'
              }`}>
                {stage.label}
              </span>
            </div>
            {idx < pipeline.length - 1 && (
              <div className="w-6 sm:w-10 h-px bg-slate-200 dark:bg-slate-800 mx-2 shrink-0">
                {(stage.status === 'DONE' || stage.status === 'STALE') && (
                  <div className="w-full h-full bg-slate-400 dark:bg-slate-500" />
                )}
              </div>
            )}
          </React.Fragment>
        ))}
      </div>
      
      <div className="mt-auto flex items-center justify-between text-[11px] font-semibold text-slate-500 dark:text-slate-400 pt-5 border-t border-slate-100 dark:border-white/5">
        <div className="flex items-center gap-3">
          {reqCount > 0 && <span>{reqCount} requirements</span>}
          {reqCount > 0 && taskCount > 0 && <span>·</span>}
          {taskCount > 0 && <span>{taskCount} tasks</span>}
          {(reqCount > 0 || taskCount > 0) && <span>·</span>}
          <span>Updated {formatDistanceToNow(new Date(workflow.updatedAt))} ago</span>
        </div>
        <div className="flex items-center gap-1 text-blue-600 dark:text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity">
          Open workflow <ArrowRight className="w-3 h-3" />
        </div>
      </div>
    </Link>
  );
}
