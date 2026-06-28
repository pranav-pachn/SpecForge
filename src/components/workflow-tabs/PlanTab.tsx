"use client";

import { useState } from "react";
import ArtifactPanel from "@/components/artifacts/ArtifactPanel";
import { useRouter } from "next/navigation";

export default function PlanTab({ 
  workflowId, 
  specArtifact,
  planArtifact 
}: { 
  workflowId: string, 
  specArtifact?: any,
  planArtifact?: any 
}) {
  const router = useRouter();
  const version = planArtifact?.versions?.[0];
  const specVersion = specArtifact?.versions?.[0];
  
  const [content, setContent] = useState(version?.content || "");
  const [isEditing, setIsEditing] = useState(!!planArtifact && !version?.content);
  const [isLoading, setIsLoading] = useState(false);

  const handleGenerate = async () => {
    setIsLoading(true);
    try {
      // In a real app we'd fetch clarifications here, but for MVP we assume they are fetched or 
      // we can rely on the spec being complete. Let's just pass the spec.
      await fetch(`/api/ai/plan`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          workflowId,
          specContent: specVersion?.content
        }),
      });
      router.refresh();
      setIsEditing(false);
    } catch (error) {
      console.error("Failed to generate plan:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveDraft = async () => {
    if (!planArtifact || !version) return;
    setIsLoading(true);
    try {
      await fetch(`/api/artifacts/${planArtifact.id}/versions/${version.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, status: "DRAFT" }),
      });
      setIsEditing(false);
      router.refresh();
    } catch (error) {
      console.error("Failed to save draft:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!planArtifact || !version) return;
    setIsLoading(true);
    try {
      await fetch(`/api/artifacts/${planArtifact.id}/versions/${version.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, status: "APPROVED" }),
      });
      await fetch(`/api/workflows/${workflowId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "TASK_BREAKDOWN" }),
      });
      router.refresh();
    } catch (error) {
      console.error("Failed to approve plan:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!planArtifact || !planArtifact.versions || planArtifact.versions.length === 0) {
    return (
      <ArtifactPanel
        title="Implementation Plan"
        status="DRAFT"
        versionNumber={1}
        content=""
        emptyStateMessage="No plan exists yet. Run generation based on your approved spec."
        onRegenerate={handleGenerate}
        isLoading={isLoading}
      />
    );
  }

  return (
    <ArtifactPanel
      title="Implementation Plan"
      status={version.status}
      versionNumber={version.version}
      content={content || version.content}
      isEditing={isEditing}
      sourceLabel={specVersion ? `Based on Spec v${specVersion.version}` : undefined}
      onContentChange={setContent}
      onToggleEdit={() => setIsEditing(!isEditing)}
      onSaveDraft={handleSaveDraft}
      onApprove={handleApprove}
      onRegenerate={handleGenerate}
      isLoading={isLoading}
    />
  );
}
