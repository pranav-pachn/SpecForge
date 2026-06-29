"use client";

import { useEffect, useState } from "react";
import { Loader2, Zap, CheckCircle2, X } from "lucide-react";
import { useRouter } from "next/navigation";

export default function ClarifyTab({ workflowId, onMutate }: { workflowId: string, onMutate?: () => void }) {
  const router = useRouter();
  const [workflow, setWorkflow] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [updating, setUpdating] = useState<Record<string, boolean>>({});
  const [regeneratingSpec, setRegeneratingSpec] = useState(false);

  useEffect(() => {
    fetchData();
  }, [workflowId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const wfRes = await fetch(`/api/workflows/${workflowId}`);
      const wfData = await wfRes.json();
      setWorkflow(wfData);

      const spec = wfData.artifacts?.find((a: any) => a.type === "SPEC");
      const versionId = spec?.versions?.[0]?.id;

      if (versionId) {
        const qRes = await fetch(`/api/clarifications?versionId=${versionId}`);
        const qData = await qRes.json();
        setQuestions(qData);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const spec = workflow.artifacts?.find((a: any) => a.type === "SPEC");
      await fetch("/api/ai/clarify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workflowId,
          versionId: spec.versions[0].id,
          specContent: spec.versions[0].content,
        }),
      });
      await fetchData();
      router.refresh();
      onMutate?.();
    } catch (e) {
      console.error(e);
    } finally {
      setGenerating(false);
    }
  };

  const submitAnswer = async (id: string, isDismiss = false) => {
    setUpdating({ ...updating, [id]: true });
    try {
      await fetch(`/api/clarifications/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(isDismiss ? { status: "DISMISSED" } : { answer: answers[id] }),
      });
      await fetchData();
      onMutate?.();
    } catch (e) {
      console.error(e);
    } finally {
      setUpdating({ ...updating, [id]: false });
    }
  };

  const handleRegenerateSpec = async () => {
    setRegeneratingSpec(true);
    try {
      const spec = workflow.artifacts?.find((a: any) => a.type === "SPEC");
      
      const answeredClarifications = questions
        .filter(q => q.status === "ANSWERED")
        .map(q => ({
          category: q.category,
          question: q.question,
          answer: q.answer?.answer || answers[q.id]
        }));

      await fetch("/api/ai/spec-regenerate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workflowId,
          versionId: spec.versions[0].id,
          specContent: spec.versions[0].content,
          clarifications: answeredClarifications,
        }),
      });
      await fetchData();
      router.refresh();
      onMutate?.();
      // Optional: Navigate to spec tab automatically or show a success message
      alert("Specification regenerated successfully. Check the Spec tab for the new version.");
    } catch (e) {
      console.error(e);
    } finally {
      setRegeneratingSpec(false);
    }
  };

  const completeClarification = async () => {
    try {
      await fetch(`/api/workflows/${workflowId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "SPEC_REVIEW" }),
      });
      router.refresh();
      onMutate?.();
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) {
    return <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-slate-400" /></div>;
  }

  const spec = workflow?.artifacts?.find((a: any) => a.type === "SPEC");
  const specVersion = spec?.versions?.[0];

  if (!specVersion || specVersion.status === "DRAFT" || specVersion.status === "STALE") {
    return (
      <div className="bg-white dark:bg-slate-950 border rounded-xl p-12 text-center shadow-sm">
        <h3 className="text-xl font-bold mb-2">Spec Not Ready</h3>
        <p className="text-slate-500 mb-6">You must approve the specification before running ambiguity checks.</p>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-950 border rounded-xl p-12 text-center shadow-sm">
        <Zap className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
        <h3 className="text-xl font-bold mb-2">Clarification Analysis</h3>
        <p className="text-slate-500 mb-6 max-w-lg mx-auto">
          Our AI will analyze your approved specification to find ambiguities, edge cases, and missing technical details before we generate a plan.
        </p>
        <button
          onClick={handleGenerate}
          disabled={generating}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-md font-medium inline-flex items-center gap-2"
        >
          {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
          Run Ambiguity Checks
        </button>
      </div>
    );
  }

  const resolvedCount = questions.filter(q => q.status !== "OPEN").length;
  const isComplete = resolvedCount === questions.length;

  const grouped = questions.reduce((acc, q) => {
    const cat = q.category || "General";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(q);
    return acc;
  }, {} as Record<string, any[]>);

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-950 border rounded-xl p-6 shadow-sm flex items-center justify-between sticky top-4 z-10">
        <div>
          <h2 className="text-xl font-bold mb-1">Clarifications</h2>
          <div className="flex items-center gap-3">
            <div className="w-48 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-blue-600 transition-all"
                style={{ width: `${(resolvedCount / questions.length) * 100}%` }}
              />
            </div>
            <span className="text-sm font-medium text-slate-500">{resolvedCount} of {questions.length} resolved</span>
          </div>
        </div>
        
        <div className="flex gap-2">
          {isComplete && questions.some(q => q.status === "ANSWERED") && (
            <button
              onClick={handleRegenerateSpec}
              disabled={regeneratingSpec}
              className="px-6 py-2.5 rounded-md font-medium text-blue-700 bg-blue-100 hover:bg-blue-200 dark:bg-blue-900/40 dark:text-blue-300 dark:hover:bg-blue-900/60 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-sm"
            >
              {regeneratingSpec ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
              {regeneratingSpec ? "Regenerating..." : "Regenerate Spec with Answers"}
            </button>
          )}
          <button
            onClick={completeClarification}
            disabled={!isComplete}
            className="px-6 py-2.5 rounded-md font-medium text-white bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-sm"
          >
            Continue to Review <CheckCircle2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="space-y-8">
        {(Object.entries(grouped) as [string, any[]][]).map(([category, catsQs]) => (
          <div key={category}>
            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4 border-b pb-2">{category}</h3>
            <div className="space-y-4">
              {catsQs.map(q => (
                <div key={q.id} className={`border rounded-xl p-5 bg-white dark:bg-slate-950 shadow-sm transition-colors ${q.status !== 'OPEN' ? 'opacity-70 border-green-200 dark:border-green-900/30' : 'border-blue-100 dark:border-blue-900/30'}`}>
                  <div className="flex justify-between items-start mb-4">
                    <p className="font-medium text-lg pr-8">{q.question}</p>
                    {q.status === "OPEN" && (
                      <button 
                        onClick={() => submitAnswer(q.id, true)}
                        disabled={updating[q.id]}
                        className="text-slate-400 hover:text-red-500 p-1" 
                        title="Dismiss irrelevant question"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                  
                  {q.status === "OPEN" ? (
                    <div className="space-y-3">
                      <textarea
                        value={answers[q.id] || ""}
                        onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })}
                        placeholder="Provide details to clarify..."
                        className="w-full h-24 p-3 border rounded-md resize-none text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:bg-slate-900 dark:border-slate-800"
                      />
                      <button
                        onClick={() => submitAnswer(q.id)}
                        disabled={updating[q.id] || !answers[q.id]}
                        className="px-4 py-2 bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-900/50 rounded-md text-sm font-medium disabled:opacity-50"
                      >
                        {updating[q.id] ? "Saving..." : "Submit Answer"}
                      </button>
                    </div>
                  ) : (
                    <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <CheckCircle2 className={`w-4 h-4 ${q.status === 'DISMISSED' ? 'text-slate-400' : 'text-green-500'}`} />
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-500">{q.status}</span>
                      </div>
                      {q.answer?.answer && (
                        <p className="text-sm text-slate-700 dark:text-slate-300">{q.answer.answer}</p>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
