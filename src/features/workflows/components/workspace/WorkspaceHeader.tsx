"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { getWorkflowPipeline } from "@/features/dashboard/utils/workflowPipeline";
import { WORKFLOW_STATUS_COLORS, WORKFLOW_STATUS_LABELS } from "@/shared/constants";
import { WorkflowStatus } from "@prisma/client";

interface WorkspaceHeaderProps {
  workflow: any;
}

export function WorkspaceHeader({ workflow }: WorkspaceHeaderProps) {
  const specArtifact = workflow.artifacts?.find((a: any) => a.type === "SPEC");
  const specContent = specArtifact?.versions?.[0]?.content || "";
  const firstSentence = specContent.split("\n").find((l: string) => l.trim().length > 10 && !l.startsWith("#")) || "";
  const description = firstSentence.length > 120 ? firstSentence.substring(0, 120) + "..." : firstSentence;

  const reqCount = specContent.match(/- \*\*.+?:/g)?.length || specContent.match(/- \[ \]/g)?.length || 0;
  const taskCount = workflow.tasks?.length || 0;

  const pipeline = getWorkflowPipeline(workflow);
  const runningStage = pipeline.find(s => s.status === 'RUNNING' || s.status === 'BLOCKED') || pipeline.find(s => s.status === 'STALE') || pipeline[0];

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this workflow? This action cannot be undone.")) return;
    
    try {
      const res = await fetch(`/api/workflows/${workflow.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        window.location.href = "/dashboard";
      } else {
        alert("Failed to delete workflow");
      }
    } catch (error) {
      console.error(error);
      alert("Error deleting workflow");
    }
  };

  return (
    <div className="mb-8">
      <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 mb-6">
        <Link href="/dashboard" className="hover:text-slate-800 dark:hover:text-slate-300 transition-colors">
          Workflows
        </Link>
        <span>/</span>
        <span className="text-slate-700 dark:text-slate-300">{workflow.name}</span>
        <span>/</span>
        <span className="text-blue-600 dark:text-blue-400">Specification</span>
      </div>
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
        <div>
          <div className="flex items-center gap-4 mb-2">
            <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white leading-tight">
              {workflow.name}
            </h1>
            <span className={`text-[10px] uppercase tracking-wider px-2.5 py-1 rounded-full font-bold whitespace-nowrap shadow-sm border ${WORKFLOW_STATUS_COLORS[workflow.status as WorkflowStatus]} ${workflow.status === 'COMPLETED' ? 'border-green-200 dark:border-green-800' : 'border-transparent'}`}>
              {WORKFLOW_STATUS_LABELS[workflow.status as WorkflowStatus]}
            </span>
          </div>
          
          {description && (
            <p className="text-lg text-slate-600 dark:text-slate-300 mb-4 max-w-3xl">
              {description}
            </p>
          )}

          <div className="flex items-center gap-3 text-xs font-semibold text-slate-500 dark:text-slate-400">
            {reqCount > 0 && <span>{reqCount} requirements</span>}
            {reqCount > 0 && taskCount > 0 && <span>·</span>}
            {taskCount > 0 && <span>{taskCount} tasks</span>}
            {(reqCount > 0 || taskCount > 0) && <span>·</span>}
            <span>Updated {formatDistanceToNow(new Date(workflow.updatedAt))} ago</span>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={handleDelete}
            className="px-4 py-2 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors border border-transparent hover:border-red-200 dark:hover:border-red-500/30"
          >
            Delete Workflow
          </button>
        </div>
      </div>
    </div>
  );
}
