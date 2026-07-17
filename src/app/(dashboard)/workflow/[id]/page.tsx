"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { WorkflowStatus } from "@prisma/client";
import PipelineStages from "@/features/workflows/components/workflows/PipelineStages";
import WorkflowTabs, { TabId } from "@/features/workflows/components/workflows/WorkflowTabs";
import { ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";

// Tab Components
import SpecTab from "@/features/workflows/components/workflow-tabs/SpecTab";
import ClarifyTab from "@/features/workflows/components/workflow-tabs/ClarifyTab";
import PlanTab from "@/features/workflows/components/workflow-tabs/PlanTab";
import TasksTab from "@/features/workflows/components/workflow-tabs/TasksTab";
import ExecuteTab from "@/features/workflows/components/workflow-tabs/ExecuteTab";
import ReviewTab from "@/features/workflows/components/workflow-tabs/ReviewTab";
import ValidateTab from "@/features/workflows/components/workflow-tabs/ValidateTab";
import DriftTab from "@/features/workflows/components/workflow-tabs/DriftTab";
import EngineeringReviewTab from "@/features/workflows/components/workflow-tabs/EngineeringReviewTab";

const STATUS_TO_TAB: Record<WorkflowStatus, TabId> = {
  DRAFT: "spec",
  CLARIFYING: "clarify",
  SPEC_REVIEW: "review",
  PLANNING: "plan",
  TASK_BREAKDOWN: "tasks",
  EXECUTING: "execute",
  ENGINEERING_REVIEW: "engineering_review",
  REVIEWING: "review",
  VALIDATING: "validate",
  COMPLETED: "validate",
  ARCHIVED: "validate",
};

export default function WorkflowPage() {
  const params = useParams();
  const [workflow, setWorkflow] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabId>("spec");
  const [refreshKey, setRefreshKey] = useState(0);

  const refreshWorkflow = () => setRefreshKey(k => k + 1);

  const [unresolvedDrift, setUnresolvedDrift] = useState(false);

  useEffect(() => {
    const fetchWorkflow = async () => {
      try {
        const res = await fetch(`/api/workflows/${params.id}`);
        if (res.ok) {
          const data = await res.json();
          setWorkflow(data);
          
          if (data.status) {
            setActiveTab(STATUS_TO_TAB[data.status as WorkflowStatus] || "spec");
          }
        }
        
        // Also check for drift
        const driftRes = await fetch(`/api/drift?workflowId=${params.id}`);
        if (driftRes.ok) {
          const driftData = await driftRes.json();
          const hasUnresolved = driftData.events?.some((e: any) => !e.resolved);
          setUnresolvedDrift(hasUnresolved);
        }
      } catch (err) {
        console.error("Failed to load workflow");
      } finally {
        setLoading(false);
      }
    };
    
    fetchWorkflow();
  }, [params.id, refreshKey]);

  if (loading) {
    return <div className="p-8 flex items-center justify-center h-64"><Loader2 className="w-6 h-6 animate-spin text-slate-400" /></div>;
  }

  if (!workflow) {
    return <div className="p-8 text-center text-slate-500">Workflow not found</div>;
  }

  const specArtifact = workflow.artifacts?.find((a: any) => a.type === "SPEC");

  return (
    <div className="max-w-6xl mx-auto py-8">
      <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800 dark:hover:text-slate-300 mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Dashboard
      </Link>

      {unresolvedDrift && activeTab !== "drift" && (
        <div className="mb-6 glass-panel border-orange-500/30 bg-orange-950/20 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-[0_0_20px_rgba(249,115,22,0.15)] animate-in">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-orange-500/20 flex items-center justify-center text-orange-400 border border-orange-500/30">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>
            </div>
            <div>
              <h3 className="text-sm font-bold text-orange-400 text-glow">Specification Updated</h3>
              <p className="text-xs text-slate-300 mt-0.5">Some artifacts are now stale. Review the impact analysis to regenerate them.</p>
            </div>
          </div>
          <button 
            onClick={() => setActiveTab("drift")}
            className="px-4 py-1.5 bg-orange-500/20 hover:bg-orange-500/30 text-orange-400 text-sm font-bold rounded-lg border border-orange-500/30 transition-all shadow-sm hover:shadow-[0_0_15px_rgba(249,115,22,0.3)]"
          >
            Review Changes
          </button>
        </div>
      )}

      <div className="mb-12">
        <h1 className="text-3xl font-bold mb-2">{workflow.name}</h1>
        <p className="text-slate-500 text-sm">Created {formatDistanceToNow(new Date(workflow.createdAt))} ago</p>
        
        <div className="mt-8 overflow-x-auto pb-8">
          <div className="min-w-[800px] px-4">
            <PipelineStages currentStatus={workflow.status} />
          </div>
        </div>
      </div>

      <WorkflowTabs activeTab={activeTab} onTabChange={setActiveTab} workflow={workflow} />
      
      <div className="mt-6">
        {activeTab === "spec" && <SpecTab workflowId={workflow.id} artifact={specArtifact} onMutate={refreshWorkflow} />}
        {activeTab === "clarify" && <ClarifyTab workflowId={workflow.id} onMutate={refreshWorkflow} onRegenerateComplete={() => setActiveTab("spec")} />}
        {activeTab === "plan" && <PlanTab workflowId={workflow.id} specArtifact={specArtifact} planArtifact={workflow.artifacts?.find((a: any) => a.type === "PLAN")} onMutate={refreshWorkflow} />}
        {activeTab === "tasks" && <TasksTab workflowId={workflow.id} onMutate={refreshWorkflow} />}
        {activeTab === "execute" && <ExecuteTab workflowId={workflow.id} onMutate={refreshWorkflow} />}
        {activeTab === "engineering_review" && <EngineeringReviewTab workflowId={workflow.id} onMutate={refreshWorkflow} />}
        {activeTab === "review" && <ReviewTab workflowId={workflow.id} onMutate={refreshWorkflow} />}
        {activeTab === "validate" && <ValidateTab workflowId={workflow.id} onMutate={refreshWorkflow} />}
        {activeTab === "drift" && <DriftTab workflowId={workflow.id} onMutate={refreshWorkflow} />}
      </div>
    </div>
  );
}