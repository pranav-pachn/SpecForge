"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { X, Sparkles, Loader2 } from "lucide-react";

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

  if (!isOpen) return null;

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
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center overflow-y-auto p-4 sm:p-6">
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl w-full max-w-3xl my-8 flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-4 border-b shrink-0">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-blue-600" />
            New Feature Workflow
          </h2>
          <button onClick={onClose} className="text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 p-1 rounded-md">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-md border border-red-100 text-sm">
              {error}
            </div>
          )}

          <form id="create-wf-form" onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-1">Feature Name</label>
              <input
                type="text"
                required
                value={featureName}
                onChange={(e) => setFeatureName(e.target.value)}
                placeholder="e.g., Dark Mode Toggle"
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-950"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Raw Idea <span className="text-slate-500 font-normal">(Describe what you want to build)</span></label>
              <textarea
                required
                rows={5}
                value={rawIdea}
                onChange={(e) => setRawIdea(e.target.value)}
                placeholder="Dump your messy thoughts, copied notes, or feature requirements here..."
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-950 font-mono text-sm"
              />
            </div>

            <div className="border-t pt-6 mt-6">
              <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-4 uppercase tracking-wider">Structured Context</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Who is this for?</label>
                  <input
                    type="text"
                    value={audience}
                    onChange={(e) => setAudience(e.target.value)}
                    placeholder="e.g., Internal ops team"
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-950 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Main outcome?</label>
                  <input
                    type="text"
                    value={goal}
                    onChange={(e) => setGoal(e.target.value)}
                    placeholder="e.g., Reduce manual data entry"
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-950 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Out of scope?</label>
                  <input
                    type="text"
                    value={outOfScope}
                    onChange={(e) => setOutOfScope(e.target.value)}
                    placeholder="e.g., Mobile app, API access"
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-950 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Constraints?</label>
                  <input
                    type="text"
                    value={constraints}
                    onChange={(e) => setConstraints(e.target.value)}
                    placeholder="e.g., Next.js only, strict PII compliance"
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-950 text-sm"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-1">Target Execution Tool</label>
                  <select
                    value={targetTool}
                    onChange={(e) => setTargetTool(e.target.value)}
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-950 text-sm bg-transparent"
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

        <div className="p-4 border-t shrink-0 bg-slate-50 dark:bg-slate-800 rounded-b-xl flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 dark:bg-slate-900 dark:text-slate-300 dark:border-slate-700"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="submit"
            form="create-wf-form"
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 flex items-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Generating Spec...
              </>
            ) : (
              "Generate Spec"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
