"use client";

import React, { useState, KeyboardEvent } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ArrowRight } from "lucide-react";

export function FeatureComposer() {
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
        body: JSON.stringify({ name: name || "New Feature Workflow" }),
      });

      if (res.ok) {
        const wf = await res.json();
        // Since SpecTab doesn't natively accept 'intakeIdea' yet, we pass it via query parameter
        // so the destination page can intercept it and run the Clarifier/Spec engine.
        // Wait, CreateWorkflowModal did this via ProgressRail. 
        // For MVP of Sprint 1, we just create it and redirect. The user will be dropped in the DRAFT state.
        // If we want it to auto-start, we could pass ?idea=... and the SpecTab handles it.
        router.push(`/workflow/${wf.id}?idea=${encodeURIComponent(idea)}`);
      }
    } catch (err) {
      console.error("Failed to create workflow from composer", err);
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
    <div className="glass rounded-3xl p-8 md:p-12 shadow-lg dark:shadow-[0_0_50px_rgba(0,0,0,0.5)] animate-up max-w-3xl mx-auto w-full text-left">
      <h3 className="text-2xl font-bold mb-6 text-slate-900 dark:text-white tracking-tight">
        What are you building?
      </h3>
      
      <div className="relative group">
        <textarea
          autoFocus
          disabled={isSubmitting}
          value={idea}
          onChange={(e) => setIdea(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Build an authentication system with Google OAuth, admin roles, rate limiting, and audit logs..."
          className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 text-lg text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 min-h-[160px] resize-y transition-all font-medium leading-relaxed"
        />
        
        <div className="absolute bottom-4 right-4 flex items-center gap-4">
          <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 bg-white dark:bg-slate-950 px-2.5 py-1 rounded-md shadow-sm border border-slate-200 dark:border-slate-800 opacity-0 group-hover:opacity-100 transition-opacity">
            <kbd className="font-sans">⌘</kbd> <kbd className="font-sans">Enter</kbd> to submit
          </span>
          <button
            onClick={handleSubmit}
            disabled={!idea.trim() || isSubmitting}
            className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/20 px-6 py-2.5 rounded-xl hover:from-blue-500 hover:to-indigo-500 font-bold transition-all disabled:opacity-50 disabled:hover:from-blue-600 disabled:hover:to-indigo-600"
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
