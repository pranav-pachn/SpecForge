"use client";

import { useState, useEffect } from "react";
import ArtifactPanel from "@/features/specs/components/ArtifactPanel";
import { useRouter } from "next/navigation";
import { useAutosave } from "@/hooks/useAutosave";
import { ArrowRight, CheckCircle2 } from "lucide-react";

export default function SpecTab({ artifact, workflowId, onMutate, onNext }: { artifact?: any, workflowId: string, onMutate?: () => void, onNext?: () => void }) {
  const router = useRouter();
  const version = artifact?.versions?.[0];
  
  const [content, setContent] = useState(version?.content || "");
  const [isEditing, setIsEditing] = useState(!version?.content);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const handleOpenEdit = () => setIsEditing(true);
    window.addEventListener('open-spec-edit', handleOpenEdit);
    return () => window.removeEventListener('open-spec-edit', handleOpenEdit);
  }, []);

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
    <div className="space-y-6">
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
      
      {version.status === "APPROVED" && (
        <div className="glass-panel p-6 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-green-500/20 bg-green-500/5 shadow-[0_0_20px_rgba(34,197,94,0.1)]">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle2 className="w-6 h-6 text-green-500" />
              <h3 className="text-xl font-bold text-white">Specification Approved</h3>
            </div>
            <p className="text-sm text-slate-400">Your requirements are structured and ready. Next up: analyze ambiguities.</p>
          </div>
          <button
            onClick={onNext}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold flex items-center gap-2 transition-all hover:shadow-[0_0_15px_rgba(37,99,235,0.4)]"
          >
            Continue to Clarify <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      )}
    </div>
  );
}
