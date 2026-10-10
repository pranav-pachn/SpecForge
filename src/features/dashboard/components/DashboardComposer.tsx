"use client";

import React, { useState, KeyboardEvent } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ArrowRight } from "lucide-react";

export function DashboardComposer() {
  const router = useRouter();
  const [idea, setIdea] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!idea.trim() || isSubmitting) return;
    setIsSubmitting(true);

    // Derive a simple name from the idea (first 4 words)
    const name = idea.split(" ").slice(0, 4).join(" ") + (idea.split(" ").length > 4 ? "..." : "");
    
    try {
      const res = await fetch("/api/workflows", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name || "New Feature Workflow", rawIdea: idea.trim() }),
      });

      if (res.ok) {
        const wf = await res.json();
        router.push(`/workflow/${wf.id}`);
      } else {
        const errorData = await res.json().catch(() => ({}));
        console.error("Failed to create workflow:", errorData);
      }
    } catch (err) {
      console.error("Failed to create workflow from composer", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="w-full">
      <div className="relative group rounded-2xl overflow-hidden glass-panel border border-slate-200 dark:border-slate-800 shadow-xl transition-all duration-300 focus-within:ring-2 focus-within:ring-blue-500/50 focus-within:border-blue-500/30">
        <textarea
          autoFocus
          disabled={isSubmitting}
          value={idea}
          onChange={(e) => setIdea(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Describe a feature, problem, or change..."
          data-testid="workflow-idea-input"
          className="w-full bg-transparent p-6 text-lg text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none min-h-[160px] resize-none font-medium leading-relaxed"
        />
        
        <div className="absolute bottom-4 right-4 flex items-center gap-4">
          <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 px-2.5 py-1 rounded-md opacity-0 group-focus-within:opacity-100 transition-opacity">
            <kbd className="font-sans">⌘</kbd> <kbd className="font-sans">Enter</kbd> to submit
          </span>
          <button
            onClick={handleSubmit}
            disabled={!idea.trim() || isSubmitting}
            data-testid="create-workflow-button"
            className="flex items-center gap-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-6 py-2.5 rounded-xl font-bold transition-all disabled:opacity-50 hover:scale-105"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                Create Workflow
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
