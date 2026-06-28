"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import PipelineStages from "@/components/workflows/PipelineStages";
import WorkflowTabs, { TabId } from "@/components/workflows/WorkflowTabs";
import { ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";

// Tab Components
import SpecTab from "@/components/workflow-tabs/SpecTab";
import ClarifyTab from "@/components/workflow-tabs/ClarifyTab";
import PlanTab from "@/components/workflow-tabs/PlanTab";
import TasksTab from "@/components/workflow-tabs/TasksTab";
import ExecuteTab from "@/components/workflow-tabs/ExecuteTab";
import ReviewTab from "@/components/workflow-tabs/ReviewTab";
import ValidateTab from "@/components/workflow-tabs/ValidateTab";
import DriftTab from "@/components/workflow-tabs/DriftTab";

export default function WorkflowPage() {
  const params = useParams();
  const [workflow, setWorkflow] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabId>("spec");

  useEffect(() => {
    const fetchWorkflow = async () => {
      try {
        const res = await fetch(`/api/workflows/${params.id}`);
        if (res.ok) {
          const data = await res.json();
          setWorkflow(data);
        }
      } catch (err) {
        console.error("Failed to load workflow");
      } finally {
        setLoading(false);
      }
    };
    
    fetchWorkflow();
  }, [params.id]);

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

      <div className="mb-12">
        <h1 className="text-3xl font-bold mb-2">{workflow.name}</h1>
        <p className="text-slate-500 text-sm">Created {formatDistanceToNow(new Date(workflow.createdAt))} ago</p>
        
        <div className="mt-8 overflow-x-auto pb-8">
          <div className="min-w-[800px] px-4">
            <PipelineStages currentStatus={workflow.status} />
          </div>
        </div>
      </div>

      <WorkflowTabs activeTab={activeTab} onTabChange={setActiveTab} />
      
      <div className="mt-6">
        {activeTab === "spec" && <SpecTab workflowId={workflow.id} artifact={specArtifact} />}
        {activeTab === "clarify" && <ClarifyTab workflowId={workflow.id} />}
        {activeTab === "plan" && <PlanTab workflowId={workflow.id} specArtifact={specArtifact} planArtifact={workflow.artifacts?.find((a: any) => a.type === "PLAN")} />}
        {activeTab === "tasks" && <TasksTab workflowId={workflow.id} />}
        {activeTab === "execute" && <ExecuteTab workflowId={workflow.id} />}
        {activeTab === "review" && <ReviewTab workflowId={workflow.id} />}
        {activeTab === "validate" && <ValidateTab workflowId={workflow.id} />}
        {activeTab === "drift" && <DriftTab workflowId={workflow.id} />}
      </div>
    </div>
  );
}