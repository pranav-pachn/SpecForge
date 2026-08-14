"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { normalizeEvents, StoredEvent } from "@/shared/utils/eventNormalizer";
import { WorkflowStatus } from "@prisma/client";
import { TabId } from "@/features/workflows/components/workflows/WorkflowTabs";

// Workspace Components
import { WorkspaceShell } from "@/features/workflows/components/workspace/WorkspaceShell";
import { WorkspaceHeader } from "@/features/workflows/components/workspace/WorkspaceHeader";
import { PipelineNavigation } from "@/features/workflows/components/workspace/PipelineNavigation";
import { IntelligenceDrawer } from "@/features/workflows/components/workspace/IntelligenceDrawer";
import { CurrentStage } from "@/features/workflows/components/workspace/CurrentStage";
import { AgentActivitySidebar } from "@/features/workflows/components/workspace/AgentActivitySidebar";
import DriftAlerts from "@/features/workflows/components/workflow-tabs/DriftAlerts";
import { CopilotWidget } from "@/features/workflows/components/workflow-tabs/CopilotWidget";

// Tab Components
import SpecTab from "@/features/workflows/components/workflow-tabs/SpecTab";
import ClarifyTab from "@/features/workflows/components/workflow-tabs/ClarifyTab";
import { PlanningWorkspace } from "@/features/planning/components/PlanningWorkspace";
import ExecuteTab from "@/features/workflows/components/workflow-tabs/ExecuteTab";
import { ReviewWorkspace } from "@/features/validation/components/ReviewWorkspace";
import { ValidationWorkspace } from "@/features/validation/components/ValidationWorkspace";
import { EngineeringReviewTab } from "@/features/workflows/components/workflow-tabs/EngineeringReviewTab";
import KnowledgeTab from "@/features/workflows/components/workflow-tabs/KnowledgeTab";
import MemoryTab from "@/features/workflows/components/workflow-tabs/MemoryTab";
import { GraphTab } from "@/features/workflows/components/workflow-tabs/GraphTab";
import { TraceabilityTab } from "@/features/workflows/components/workflow-tabs/TraceabilityTab";
import { TimelineTab } from "@/features/workflows/components/workflow-tabs/TimelineTab";

const STATUS_TO_TAB: Record<WorkflowStatus, TabId> = {
  DRAFT: "spec",
  CLARIFYING: "clarify",
  SPEC_REVIEW: "review",
  PLANNING: "plan",
  WAITING_FOR_APPROVAL: "plan",
  TASK_BREAKDOWN: "plan",
  READY_FOR_EXECUTION: "plan",
  EXECUTING: "execute",
  ENGINEERING_REVIEW: "eng-review",
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

  const [rawEvents, setRawEvents] = useState<StoredEvent[]>([]);

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
      } catch (err) {
        console.error("Failed to load workflow");
      } finally {
        setLoading(false);
      }
    };
    
    const fetchEvents = async () => {
      try {
        const res = await fetch(`/api/workflows/${params.id}/events`);
        if (res.ok) {
          const data = await res.json();
          setRawEvents((prev) => {
            const newEvents = data.events || [];
            if (prev.length === newEvents.length && JSON.stringify(prev) === JSON.stringify(newEvents)) {
              return prev;
            }
            return newEvents;
          });
        }
      } catch (err) {
        console.error("Failed to load events");
      }
    };

    fetchWorkflow();
    fetchEvents();

    const interval = setInterval(fetchEvents, 3000);
    return () => clearInterval(interval);
  }, [params.id, refreshKey]);

  const { orchestration, agents } = normalizeEvents(rawEvents);

  if (loading) {
    return (
      <div className="p-8 max-w-7xl mx-auto w-full animate-pulse">
        <div className="h-8 bg-slate-200 dark:bg-white/5 rounded w-1/4 mb-4"></div>
        <div className="h-4 bg-slate-200 dark:bg-white/5 rounded w-1/3 mb-12"></div>
        
        <div className="flex gap-8">
          <div className="flex-1 space-y-6">
            <div className="h-10 bg-slate-200 dark:bg-white/5 rounded w-full"></div>
            <div className="h-64 bg-slate-200 dark:bg-white/5 rounded-2xl w-full"></div>
          </div>
          <div className="w-80 space-y-4">
            <div className="h-32 bg-slate-200 dark:bg-white/5 rounded-2xl w-full"></div>
            <div className="h-32 bg-slate-200 dark:bg-white/5 rounded-2xl w-full"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!workflow) {
    return <div className="p-8 text-center text-slate-500">Workflow not found</div>;
  }

  const specArtifact = workflow.artifacts?.find((a: any) => a.type === "SPEC");

  const mainContent = (
    <AnimatePresence mode="wait">
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.2 }}
      >
        {activeTab === "spec" && <SpecTab workflowId={workflow.id} artifact={specArtifact} onMutate={refreshWorkflow} onNext={() => setActiveTab("clarify")} />}
        {activeTab === "clarify" && <ClarifyTab workflowId={workflow.id} onMutate={refreshWorkflow} onRegenerateComplete={() => setActiveTab("spec")} onNext={() => setActiveTab("review")} />}
        {activeTab === "plan" && <PlanningWorkspace workflowId={workflow.id} specArtifact={specArtifact} planArtifact={workflow.artifacts?.find((a: any) => a.type === "PLAN")} workflowStatus={workflow.status} onMutate={refreshWorkflow} onNext={() => setActiveTab("execute")} />}
        {activeTab === "execute" && <ExecuteTab workflowId={workflow.id} onMutate={refreshWorkflow} onNext={() => setActiveTab("eng-review")} />}
        {activeTab === "eng-review" && <EngineeringReviewTab workflowId={workflow.id} onMutate={refreshWorkflow} onNext={() => setActiveTab("review")} />}
        {activeTab === "review" && <ReviewWorkspace workflowId={workflow.id} workflowStatus={workflow.status} onMutate={refreshWorkflow} onNext={() => setActiveTab("validate")} />}
        {activeTab === "validate" && <ValidationWorkspace workflowId={workflow.id} workflowStatus={workflow.status} onMutate={refreshWorkflow} onNext={() => {}} onEditSpec={() => setActiveTab("spec")} />}
        {activeTab === "timeline" && <TimelineTab workflowId={workflow.id} events={rawEvents} orchestration={orchestration} />}
      </motion.div>
    </AnimatePresence>
  );

  let displayEvents = [...rawEvents];
  
  // Display real events only

  return (
    <>
      <DriftAlerts workflowId={workflow.id} />
      
      <WorkspaceShell 
        header={<WorkspaceHeader workflow={workflow} />}
        navigation={<PipelineNavigation workflow={workflow} activeTab={activeTab} onTabChange={setActiveTab} />}
        intelligence={<IntelligenceDrawer activeTab={activeTab} onTabChange={setActiveTab} />}
        currentStageHeader={<CurrentStage workflow={workflow} activeTab={activeTab} />}
        mainContent={mainContent}
        agentActivity={<AgentActivitySidebar agents={displayEvents} />}
      />

      <CopilotWidget workflowId={workflow.id} />
    </>
  );
}