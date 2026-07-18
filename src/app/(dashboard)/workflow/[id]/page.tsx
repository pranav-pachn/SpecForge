"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { WorkflowStatus } from "@prisma/client";
import PipelineStages from "@/features/workflows/components/workflows/PipelineStages";
import WorkflowTabs, { TabId } from "@/features/workflows/components/workflows/WorkflowTabs";
import { ArrowLeft, Loader2, Zap } from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { ExportMenu } from "@/components/ui/ExportMenu";

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
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">{workflow.name}</h1>
          
          {(() => {
            const WORKFLOW_STEPS = [
              "DRAFT", "CLARIFYING", "SPEC_REVIEW", "PLANNING", 
              "TASK_BREAKDOWN", "EXECUTING", "ENGINEERING_REVIEW", 
              "REVIEWING", "VALIDATING"
            ];
            const completedSteps = WORKFLOW_STEPS.includes(workflow.status) 
              ? WORKFLOW_STEPS.indexOf(workflow.status) 
              : WORKFLOW_STEPS.length;
            const totalSteps = WORKFLOW_STEPS.length;
            
            const specContent = workflow.artifacts?.find((a: any) => a.type === "SPEC")?.versions?.[0]?.content || "";
            const planContent = workflow.artifacts?.find((a: any) => a.type === "PLAN")?.versions?.[0]?.content || "";
            const taskList = workflow.tasks?.map((t: any) => `- [${t.status === 'DONE' ? 'x' : ' '}] **${t.title}** (${t.priority ?? 'medium'} priority)\n  ${t.description ?? ''}`).join("\n") || "";
            const combinedContent = [
              `# ${workflow.name}`,
              `> Generated by SpecForge · ${new Date().toLocaleDateString()}`,
              "",
              specContent ? `## 📋 Specification\n\n${specContent}` : "",
              planContent ? `---\n\n## 🗺️ Implementation Plan\n\n${planContent}` : "",
              taskList    ? `---\n\n## ✅ Task Breakdown\n\n${taskList}` : "",
            ].filter(Boolean).join("\n\n");
            const safeFilename = workflow.name.replace(/[^a-z0-9]/gi, "-").toLowerCase();
            
            return (
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-3 bg-white/5 px-4 py-2 rounded-xl border border-white/10">
                  <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">
                    {completedSteps} / {totalSteps} Steps Complete
                  </span>
                  <div className="w-32 sm:w-48 h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden shadow-inner">
                    <div 
                      className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-700 ease-out" 
                      style={{ width: `${(completedSteps / totalSteps) * 100}%` }}
                    />
                  </div>
                </div>
                <ExportMenu 
                  content={combinedContent} 
                  filename={safeFilename} 
                />
              </div>
            );
          })()}
        </div>
        <p className="text-slate-500 text-sm">Created {formatDistanceToNow(new Date(workflow.createdAt))} ago</p>
        
        <div className="mt-8 overflow-x-auto pb-8">
          <div className="min-w-[800px] px-4">
            <PipelineStages currentStatus={workflow.status} />
          </div>
        </div>
      </div>

      <div id="workflow-content">
        <WorkflowTabs activeTab={activeTab} onTabChange={setActiveTab} workflow={workflow} />
        
        <div className="mt-6">
          {activeTab === "spec" && <SpecTab workflowId={workflow.id} artifact={specArtifact} onMutate={refreshWorkflow} onNext={() => setActiveTab("clarify")} />}
          {activeTab === "clarify" && <ClarifyTab workflowId={workflow.id} onMutate={refreshWorkflow} onRegenerateComplete={() => setActiveTab("spec")} onNext={() => setActiveTab("review")} />}
          {activeTab === "plan" && <PlanTab workflowId={workflow.id} specArtifact={specArtifact} planArtifact={workflow.artifacts?.find((a: any) => a.type === "PLAN")} onMutate={refreshWorkflow} onNext={() => setActiveTab("tasks")} />}
          {activeTab === "tasks" && <TasksTab workflowId={workflow.id} onMutate={refreshWorkflow} onNext={() => setActiveTab("execute")} />}
          {activeTab === "execute" && <ExecuteTab workflowId={workflow.id} onMutate={refreshWorkflow} onNext={() => setActiveTab("engineering_review")} />}
          {activeTab === "engineering_review" && <EngineeringReviewTab workflowId={workflow.id} onMutate={refreshWorkflow} onNext={() => setActiveTab("review")} />}
          {activeTab === "review" && <ReviewTab workflowId={workflow.id} onMutate={refreshWorkflow} onNext={() => setActiveTab("validate")} />}
          {activeTab === "validate" && <ValidateTab workflowId={workflow.id} onMutate={refreshWorkflow} onNext={() => setActiveTab("drift")} onEditSpec={() => setActiveTab("spec")} />}
          {activeTab === "drift" && <DriftTab workflowId={workflow.id} workflowStatus={workflow.status} onMutate={refreshWorkflow} />}
        </div>
      </div>

      {/* AI Activity Widget (Premium UX Mock) */}
      <div className="fixed bottom-6 right-6 z-40 animate-in fade-in slide-in-from-bottom-4">
        <div className="glass-panel border-blue-500/20 bg-black/40 backdrop-blur-md rounded-2xl p-3 flex items-center gap-3 shadow-[0_0_20px_rgba(59,130,246,0.15)] group hover:bg-black/60 transition-colors cursor-default">
          <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center relative">
            <Zap className="w-4 h-4 text-blue-400 group-hover:animate-pulse" />
            <div className="absolute inset-0 border border-blue-500/50 rounded-full animate-[spin_4s_linear_infinite]" />
          </div>
          <div className="hidden sm:block pr-2">
            <div className="text-[10px] uppercase font-bold text-blue-500 tracking-wider">SpecForge Engine</div>
            <div className="text-xs font-medium text-slate-300">Active · ~142ms latency</div>
          </div>
        </div>
      </div>
    </div>
  );
}