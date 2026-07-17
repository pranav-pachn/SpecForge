"use client";

import { useState } from "react";
import ArtifactPanel from "@/features/specs/components/ArtifactPanel";
import { useRouter } from "next/navigation";
import { useAutosave } from "@/hooks/useAutosave";

export default function SpecTab({ artifact, workflowId, onMutate }: { artifact?: any, workflowId: string, onMutate?: () => void }) {
  const router = useRouter();
  const version = artifact?.versions?.[0];
  
  const [content, setContent] = useState(version?.content || "");
  const [isEditing, setIsEditing] = useState(!version?.content);
  const [isLoading, setIsLoading] = useState(false);

  useAutosave(content, async () => {
    if (isEditing && version?.content !== content) {
      await handleSaveDraft();
    }
  }, 3000, isEditing);

  // Check how many of the 12 sections are present
  const sectionKeywords = [
    "Overview", "Goals", "Non-goals", "Target Users", 
    "Functional Requirements", "Acceptance Criteria", "Edge Cases", 
    "Non-functional Requirements", "Technical Constraints", 
    "Risks", "Rollout", "Open Questions"
  ];
  
  const presentSections = sectionKeywords.filter(keyword => 
    content.toLowerCase().includes(keyword.toLowerCase())
  ).length;

  const handleSaveDraft = async () => {
    if (!artifact || !version) return;
    setIsLoading(true);
    try {
      await fetch(`/api/artifacts/${artifact.id}/versions/${version.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, status: "DRAFT" }),
      });
      setIsEditing(false);
      router.refresh();
      onMutate?.();
    } catch (error) {
      console.error("Failed to save draft:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!artifact || !version) return;
    setIsLoading(true);
    try {
      await fetch(`/api/artifacts/${artifact.id}/versions/${version.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, status: "APPROVED" }),
      });
      await fetch(`/api/workflows/${workflowId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "CLARIFYING" }),
      });
      router.refresh();
      onMutate?.();
    } catch (error) {
      console.error("Failed to approve spec:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!artifact || !artifact.versions || artifact.versions.length === 0) {
    return (
      <ArtifactPanel
        title="Specification"
        status="DRAFT"
        versionNumber={1}
        content=""
        emptyStateMessage="No specification exists yet."
      />
    );
  }

  return (
    <ArtifactPanel
      title="Specification"
      status={version.status}
      versionNumber={version.version}
      content={content}
      artifactId={artifact.id}
      onVersionSelect={(v) => {
        setContent(v.content);
        setIsEditing(false);
      }}
      isEditing={isEditing}
      onContentChange={setContent}
      onToggleEdit={() => setIsEditing(!isEditing)}
      onSaveDraft={handleSaveDraft}
      onApprove={handleApprove}
      isLoading={isLoading}
      completenessLabel={`${presentSections}/12 sections`}
    />
  );
}
