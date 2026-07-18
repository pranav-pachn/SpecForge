"use client";

import { useState } from "react";
import ArtifactPanel from "@/features/specs/components/ArtifactPanel";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useAutosave } from "@/hooks/useAutosave";
import { ArrowRight, CheckCircle2 } from "lucide-react";

export default function PlanTab({ 
  workflowId, 
  specArtifact,
  planArtifact,
  onMutate,
  onNext 
}: { 
  workflowId: string, 
  specArtifact?: any,
  planArtifact?: any,
  onMutate?: () => void,
  onNext?: () => void
}) {
  const router = useRouter();
  const version = planArtifact?.versions?.[0];
  const specVersion = specArtifact?.versions?.[0];
  
  const [content, setContent] = useState(version?.content || "");
  const [isEditing, setIsEditing] = useState(!!planArtifact && !version?.content);
  const [isLoading, setIsLoading] = useState(false);

  useAutosave(content, async () => {
    if (isEditing && version?.content !== content) {
      await handleSaveDraft();
    }
  }, 3000, isEditing);

  const handleGenerate = async () => {
    setIsLoading(true);
    try {
      // Fetch clarifications for context
      const clarRes = await fetch(`/api/clarifications?versionId=${specVersion?.id}`);
      const clarifications = await clarRes.json();
      const answeredClarifications = clarifications
        .filter((c: any) => c.status === "ANSWERED")
        .map((c: any) => ({ question: c.question, answer: c.answer?.answer }));

      const generatePromise = fetch(`/api/ai/plan`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          workflowId,
          specContent: specVersion?.content,
          clarifications: answeredClarifications
        }),
      });
      
      toast.promise(generatePromise, {
        loading: "Generating implementation plan...",
        success: "Plan generated successfully!",
        error: "Failed to generate plan"
      });

      const res = await generatePromise;
      const data = await res.json();
      if (res.ok && data.content) {
        setContent(data.content);
      }
      router.refresh();
      setIsEditing(false);
      onMutate?.();
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
      onMutate?.();
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
      onMutate?.();
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
    <div className="space-y-6">
      <ArtifactPanel
        title="Implementation Plan"
        status={version.status}
        versionNumber={version.version}
        content={content || version.content}
        artifactId={planArtifact.id}
        onVersionSelect={(v) => {
          setContent(v.content);
          setIsEditing(false);
        }}
        isEditing={isEditing}
        sourceLabel={specVersion ? `Based on Spec v${specVersion.version}` : undefined}
        onContentChange={setContent}
        onToggleEdit={() => setIsEditing(!isEditing)}
        onSaveDraft={handleSaveDraft}
        onApprove={handleApprove}
        onRegenerate={handleGenerate}
        isLoading={isLoading}
      />
      
      {version.status === "APPROVED" && (
        <div className="glass-panel p-6 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-green-500/20 bg-green-500/5 shadow-[0_0_20px_rgba(34,197,94,0.1)]">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle2 className="w-6 h-6 text-green-500" />
              <h3 className="text-xl font-bold text-white">Plan Approved</h3>
            </div>
            <p className="text-sm text-slate-400">Implementation plan finalized. Next up: break it down into tasks.</p>
          </div>
          <button
            onClick={onNext}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold flex items-center gap-2 transition-all hover:shadow-[0_0_15px_rgba(37,99,235,0.4)]"
          >
            Continue to Tasks <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      )}
    </div>
  );
}
