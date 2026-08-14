"use client";

import { useState } from "react";
import { PlanningHeader } from "./PlanningHeader";
import { ArchitectureView } from "./architecture/ArchitectureView";
import { TaskGraph } from "./tasks/TaskGraph";
import { PlanReview } from "./review/PlanReview";

export function PlanningWorkspace({
  workflowId,
  specArtifact,
  planArtifact,
  workflowStatus,
  onMutate,
  onNext,
}: {
  workflowId: string;
  specArtifact?: any;
  planArtifact?: any;
  workflowStatus: string;
  onMutate?: () => void;
  onNext?: () => void;
}) {
  const [activeSection, setActiveSection] = useState<"overview" | "architecture" | "tasks" | "review">("overview");

  return (
    <div className="flex flex-col h-[calc(100vh-12rem)] overflow-hidden">
      <PlanningHeader 
        activeSection={activeSection} 
        onSectionChange={setActiveSection} 
        workflowStatus={workflowStatus}
      />
      
      <div className="flex-1 overflow-y-auto bg-slate-50 dark:bg-[#05050a]">
        {activeSection === "overview" && (
          <div className="p-8 max-w-5xl mx-auto space-y-8">
            <ArchitectureView planArtifact={planArtifact} workflowId={workflowId} />
            <TaskGraph planArtifact={planArtifact} workflowId={workflowId} />
          </div>
        )}
        
        {activeSection === "architecture" && (
          <div className="h-full p-8">
            <ArchitectureView planArtifact={planArtifact} workflowId={workflowId} />
          </div>
        )}
        
        {activeSection === "tasks" && (
          <div className="h-full p-8">
            <TaskGraph planArtifact={planArtifact} workflowId={workflowId} />
          </div>
        )}
        
        {activeSection === "review" && (
          <div className="p-8 max-w-3xl mx-auto">
            <PlanReview workflowId={workflowId} workflowStatus={workflowStatus} onMutate={onMutate} onNext={onNext} />
          </div>
        )}
      </div>
    </div>
  );
}
