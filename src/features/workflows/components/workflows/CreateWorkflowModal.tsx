"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { X, Sparkles, Loader2, Wand2 } from "lucide-react";

export default function CreateWorkflowModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  
  const [featureName, setFeatureName] = useState("");
  const [rawIdea, setRawIdea] = useState("");
  const [audience, setAudience] = useState("");
  const [goal, setGoal] = useState("");
  const [outOfScope, setOutOfScope] = useState("");
  const [constraints, setConstraints] = useState("");
  const [targetTool, setTargetTool] = useState("");
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [show, setShow] = useState(false);

  // Animation and keyboard handling
  useEffect(() => {
    if (isOpen) {
      setShow(true);
      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === 'Escape') onClose();
      };
      window.addEventListener('keydown', handleEscape);
      return () => window.removeEventListener('keydown', handleEscape);
    } else {
      setTimeout(() => setShow(false), 300); // match transition duration
    }
  }, [isOpen, onClose]);

  if (!isOpen && !show) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // 1. Create the Workflow & Draft Spec
      const wfRes = await fetch("/api/workflows", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: featureName }),
      });
      const wfData = await wfRes.json();
      if (!wfRes.ok) throw new Error(wfData.error || "Failed to create workflow");

      // The new workflow API creates the first Spec artifact and draft version
      // We need to fetch the artifact to get the version ID
      const artifactRes = await fetch(`/api/artifacts?workflowId=${wfData.id}`);
      const artifacts = await artifactRes.json();
      const specArtifact = artifacts.find((a: any) => a.type === "SPEC");
      const draftVersion = specArtifact?.versions[0];

      if (!draftVersion) throw new Error("Could not find draft spec version");

      // 2. Generate the Spec via AI using the hybrid intake fields
      const aiRes = await fetch("/api/ai/spec", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workflowId: wfData.id,
          versionId: draftVersion.id,
          rawIdea,
          audience,
          goal,
          outOfScope,
          constraints,
          targetTool,
        }),
      });
      const aiData = await aiRes.json();
      if (!aiRes.ok) throw new Error(aiData.error || "Failed to generate spec");

      // Success! Redirect to the workflow pipeline page
      onClose();
      router.push(`/workflow/${wfData.id}`);
    } catch (err: any) {
      setError(err.message || "An error occurred");
      setLoading(false);
    }
  };

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center overflow-y-auto p-4 sm:p-6 transition-all duration-300 ${isOpen ? 'bg-black/40 backdrop-blur-sm opacity-100' : 'bg-transparent opacity-0 pointer-events-none'}`}>
      <div 
        className={`bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-3xl my-8 flex flex-col max-h-[90vh] transition-all duration-300 ${isOpen ? 'scale-100 translate-y-0 opacity-100' : 'scale-95 translate-y-4 opacity-0'}`}
      >
        <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <div className="p-1.5 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-lg">
              <Sparkles className="h-5 w-5" />
            </div>
            New Feature Workflow
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 dark:hover:text-slate-300 p-1.5 rounded-lg transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 relative">
          {loading && (
            <div className="absolute inset-0 z-10 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm flex flex-col items-center justify-center">
              <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/20 rounded-full flex items-center justify-center mb-4 animate-pulse">
                <Wand2 className="w-8 h-8 text-blue-600 animate-bounce" />
              </div>
              <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-2">Forging your Spec...</h3>
              <p className="text-slate-500 font-medium">Analyzing raw input and structuring requirements.</p>
            </div>
          )}

          {error && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-lg border border-red-100 dark:border-red-900/50 text-sm font-medium flex items-center gap-2">
              <X className="w-4 h-4 shrink-0" /> {error}
            </div>
          )}

          <form id="create-wf-form" onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold mb-1.5">Feature Name</label>
              <input
                type="text"
                required
                value={featureName}
                onChange={(e) => setFeatureName(e.target.value)}
                placeholder="e.g., Dark Mode Toggle"
                className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-950 transition-shadow"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-1.5">Raw Idea <span className="text-slate-400 font-normal">(Describe what you want to build)</span></label>
              <textarea
                required
                rows={5}
                value={rawIdea}
                onChange={(e) => setRawIdea(e.target.value)}
                placeholder="Dump your messy thoughts, copied notes, or feature requirements here..."
                className="w-full px-4 py-3 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-950 font-mono text-sm leading-relaxed transition-shadow"
              />
            </div>

            <div className="border-t border-slate-100 dark:border-slate-800 pt-6 mt-6">
              <h3 className="text-[10px] font-bold text-slate-400 dark:text-slate-500 mb-4 uppercase tracking-widest">Structured Context (Optional but recommended)</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-semibold mb-1.5">Who is this for?</label>
                  <input
                    type="text"
                    value={audience}
                    onChange={(e) => setAudience(e.target.value)}
                    placeholder="e.g., Internal ops team"
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-950 text-sm transition-shadow"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1.5">Main outcome?</label>
                  <input
                    type="text"
                    value={goal}
                    onChange={(e) => setGoal(e.target.value)}
                    placeholder="e.g., Reduce manual data entry"
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-950 text-sm transition-shadow"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1.5">Out of scope?</label>
                  <input
                    type="text"
                    value={outOfScope}
                    onChange={(e) => setOutOfScope(e.target.value)}
                    placeholder="e.g., Mobile app, API access"
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-950 text-sm transition-shadow"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1.5">Constraints?</label>
                  <input
                    type="text"
                    value={constraints}
                    onChange={(e) => setConstraints(e.target.value)}
                    placeholder="e.g., Next.js only, strict PII compliance"
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-950 text-sm transition-shadow"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold mb-1.5">Target Execution Tool</label>
                  <select
                    value={targetTool}
                    onChange={(e) => setTargetTool(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-950 text-sm bg-transparent transition-shadow"
                  >
                    <option value="">Select a tool...</option>
                    <option value="Cursor">Cursor</option>
                    <option value="Claude Code">Claude Code</option>
                    <option value="Windsurf">Windsurf</option>
                    <option value="Generic Markdown">Generic Markdown</option>
                  </select>
                </div>
              </div>
            </div>
          </form>
        </div>

        <div className="p-5 border-t border-slate-100 dark:border-slate-800 shrink-0 bg-slate-50 dark:bg-slate-800/50 rounded-b-2xl flex justify-between items-center">
          <div className="text-xs text-slate-400 font-medium">
            Press <kbd className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 font-mono">Esc</kbd> to cancel
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 text-sm font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 dark:bg-slate-900 dark:text-slate-300 dark:border-slate-700 transition-colors shadow-sm"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              form="create-wf-form"
              disabled={loading}
              className="px-5 py-2.5 text-sm font-semibold text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 flex items-center gap-2 disabled:opacity-50 transition-all shadow-sm hover:shadow"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                "Generate Spec"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
