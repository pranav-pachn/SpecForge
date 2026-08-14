"use client";

import { useState, useEffect } from "react";
import ArtifactPanel from "@/features/specs/components/ArtifactPanel";
import { useRouter } from "next/navigation";
import { useAutosave } from "@/shared/hooks/useAutosave";
import { SpecReviewChecklist } from "@/features/specs/components/SpecReviewChecklist";
import { ContextPanel } from "@/features/specs/components/ContextPanel";

export default function SpecTab({ artifact, workflowId, onMutate, onNext }: { artifact?: any, workflowId: string, onMutate?: () => void, onNext?: () => void }) {
  const router = useRouter();
  const version = artifact?.versions?.[0];
  
  const defaultTemplate = `# Specification\n\n## Goals\nDefine what you want to achieve.\n\n## Scope & Non-goals\nDefine what is included and excluded.\n\n## Acceptance Criteria\nList the conditions for success.\n`;
  const [content, setContent] = useState(version?.content || defaultTemplate);
  const [isEditing, setIsEditing] = useState(version?.status === "DRAFT" || version?.status === "NEEDS_REVIEW" || !version?.content);
  const [isLoading, setIsLoading] = useState(false);
  const [viewMode, setViewMode] = useState<"focus" | "review" | "context">("review");

  useEffect(() => {
    const handleOpenEdit = () => setIsEditing(true);
    window.addEventListener('open-spec-edit', handleOpenEdit);
    return () => window.removeEventListener('open-spec-edit', handleOpenEdit);
  }, []);

  // Update edit mode when version status changes (e.g. after approval or new revision)
  useEffect(() => {
    if (version?.status === "APPROVED") {
      setIsEditing(false);
    } else {
      setIsEditing(true);
    }
    setContent(version?.content || defaultTemplate);
  }, [version?.id, version?.status]);

  useAutosave(content, async () => {
    if (isEditing && version?.content !== content && version?.status !== "APPROVED") {
      await handleSaveDraft();
    }
  }, 3000, isEditing);

  const handleSaveDraft = async () => {
    if (!artifact || !version) return;
    setIsLoading(true);
    try {
      await fetch(`/api/artifacts/${artifact.id}/versions/${version.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, status: "DRAFT" }),
      });
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
      setIsEditing(false);
      router.refresh();
      onMutate?.();
      onNext?.();
    } catch (error) {
      console.error("Failed to approve spec:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateRevision = async () => {
    if (!artifact || !version) return;
    setIsLoading(true);
    try {
      // Logic to create a new draft version from the approved one
      await fetch(`/api/artifacts/${artifact.id}/versions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, status: "DRAFT" }), // usually backend handles incrementing version
      });
      // We also need to reset the workflow status if we go back to drafting, but let's assume the backend handles this or we just set it
      await fetch(`/api/workflows/${workflowId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "DRAFT" }),
      });
      setIsEditing(true);
      router.refresh();
      onMutate?.();
    } catch (error) {
      console.error("Failed to create revision:", error);
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
    <div className="flex h-[calc(100vh-14rem)] bg-white dark:bg-[#05050a] rounded-2xl border border-slate-200 dark:border-white/10 overflow-hidden shadow-sm transition-all">
      
      {/* Main Column: Editor/Preview (70-100%) */}
      <div className={`flex-1 flex flex-col min-w-0 ${viewMode === "focus" ? 'w-full' : ''}`}>
        <ArtifactPanel
          title="Specification"
          status={version.status}
          versionNumber={version.version}
          content={content}
          artifactId={artifact.id}
          onVersionSelect={(v) => {
            setContent(v.content);
            setIsEditing(v.status !== "APPROVED");
          }}
          isEditing={isEditing}
          onContentChange={setContent}
          onToggleEdit={() => setIsEditing(!isEditing)}
          onSaveDraft={handleSaveDraft}
          onCreateRevision={handleCreateRevision}
          isLoading={isLoading}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
        />
      </div>

      {/* Right Column: Sidebar Panels (Review & Context) */}
      {viewMode === "review" && (
        <div className="hidden lg:flex w-80 xl:w-96 shrink-0 flex-col border-l border-slate-200 dark:border-white/5 bg-slate-50/30 dark:bg-black/10 overflow-hidden">
          <div className="flex-1 overflow-y-auto">
            <div className="p-4 border-b border-slate-200 dark:border-white/5">
              <SpecReviewChecklist 
                content={content} 
                onApprove={handleApprove} 
                isLoading={isLoading}
                onAction={(id) => {
                  const templates: Record<string, string> = {
                    goals: "\n\n## Goals\nDefine what you want to achieve.\n",
                    scope: "\n\n## Scope & Non-goals\nDefine what is included and excluded.\n",
                    criteria: "\n\n## Acceptance Criteria\nList the conditions for success.\n",
                    api: "\n\n## API / Interfaces\nDefine any API endpoints or external interfaces.\n",
                    rollback: "\n\n## Rollback Strategy\nDefine how to recover from failure.\n"
                  };
                  if (templates[id] && !content.includes(templates[id].trim().split('\n')[0])) {
                    setContent((prev: string) => prev + templates[id]);
                    setIsEditing(true);
                  }
                }}
              />
            </div>
            <div className="p-4">
              <ContextPanel workflowId={workflowId} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
