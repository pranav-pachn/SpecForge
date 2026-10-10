"use client";

import { useEffect, useState } from "react";
import { Loader2, Zap, CheckCircle2, ArrowRight, Network } from "lucide-react";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import ProgressRail from "../generate/ProgressRail";

export default function ClarifyTab({ workflowId, onMutate, onRegenerateComplete, onNext }: { workflowId: string, onMutate?: () => void, onRegenerateComplete?: () => void, onNext?: () => void }) {
  const router = useRouter();
  const [workflow, setWorkflow] = useState<any>(null);
  const [specVersionId, setSpecVersionId] = useState<string | null>(null);
  const [ambiguityScore, setAmbiguityScore] = useState<number>(0);
  const [questions, setQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [updating, setUpdating] = useState<Record<string, boolean>>({});
  const [regeneratingSpec, setRegeneratingSpec] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetchData(true);
  }, [workflowId]);

  const fetchData = async (autoGenerate = false) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/workflows/${workflowId}`);
      const wfData = await res.json();
      setWorkflow(wfData);

      const spec = wfData.artifacts?.find((a: any) => a.type === "SPEC");
      const versionId = spec?.versions?.[0]?.id;
      setSpecVersionId(versionId);
      setAmbiguityScore(spec?.versions?.[0]?.ambiguityScore || 0);

      const qRes = await fetch(`/api/clarifications?workflowId=${workflowId}`);
      const fetchedQuestions = await qRes.json();
      setQuestions(fetchedQuestions);

      // Auto-generate if empty and in CLARIFYING state
      const specContent = spec?.versions?.[0]?.content || "";
      if (
        autoGenerate &&
        fetchedQuestions.length === 0 &&
        wfData.status === "CLARIFYING" &&
        specContent.trim().length > 0
      ) {
        // Trigger generation without re-fetching wfData (we have it already)
        setGenerating(true);
        try {
          await fetch("/api/ai/clarify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              workflowId,
              versionId,
              specContent,
            }),
          });
          // Re-fetch questions after generation
          const qRes2 = await fetch(`/api/clarifications?workflowId=${workflowId}`);
          setQuestions(await qRes2.json());
          onMutate?.();
        } catch (e) {
          console.error("Auto-generate clarifications failed:", e);
        } finally {
          setGenerating(false);
        }
      }
    } catch (e: any) {
      if (e?.type === 'cancelation' || e?.msg?.includes('canceled')) {
        // Ignore Next.js Fast Refresh/navigation cancelations
        return;
      }
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

  const handleRegenerateSpec = () => {
    setRegeneratingSpec(true);
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
      onNext?.();
    } catch (e) {
      console.error(e);
    }
  };

  if (regeneratingSpec) {
    const answeredClarifications = questions
      .filter(q => q.status === "ANSWERED")
      .map(q => ({
        category: q.category,
        question: q.question,
        answer: q.answer?.answer || answers[q.id]
      }));
      
    return (
      <div className="max-w-2xl mx-auto py-12">
         <ProgressRail 
            workflowId={workflowId}
            intakeData={{ 
              phase: 'generate', 
              clarifications: answeredClarifications, 
              planning: workflow?.artifacts?.find((a: any) => a.type === "PLAN")?.versions?.[0]?.content ? JSON.parse(workflow.artifacts.find((a: any) => a.type === "PLAN").versions[0].content) : undefined 
            }}
            onComplete={() => {
              setRegeneratingSpec(false);
              setSuccess(true);
              fetchData();
              onMutate?.();
              setTimeout(() => onRegenerateComplete?.(), 1500);
            }}
            onError={(msg) => {
              console.error(msg);
              setRegeneratingSpec(false);
            }}
         />
      </div>
    );
  }

  if (loading) {
    return <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-slate-400" /></div>;
  }



  if (questions.length === 0) {
    return (
      <div className="glass-panel rounded-3xl p-16 text-center max-w-2xl mx-auto mt-8">
        <div className="w-20 h-20 bg-blue-500/10 border border-blue-500/20 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-6">
          {generating ? (
            <Loader2 className="w-10 h-10 animate-spin" />
          ) : (
            <Network className="w-10 h-10" />
          )}
        </div>
        <h3 className="text-3xl font-bold mb-4 text-slate-900 dark:text-white tracking-tight">
          {generating ? "Analyzing Specification..." : "Engineering Decisions"}
        </h3>
        <p className="text-slate-500 dark:text-slate-400 mb-10 text-lg leading-relaxed">
          {generating
            ? "SpecForge is identifying ambiguities, required decisions, and architectural impacts in your specification. This may take a moment."
            : "SpecForge will analyze your approved specification to extract required engineering decisions, architectural impact, and clarify any ambiguities before planning tasks."}
        </p>
        {!generating && (
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3.5 rounded-xl font-bold inline-flex items-center gap-2 shadow-lg transition-all duration-300 hover:-translate-y-0.5"
          >
            <Network className="w-5 h-5" />
            Analyze Specification
          </button>
        )}
      </div>
    );
  }

  const resolvedCount = questions.filter(q => q.status !== "OPEN").length;
  const requiredQuestions = questions.filter(q => q.impact?.isRequired);
  const requiredUnanswered = requiredQuestions.filter(q => q.status === "OPEN").length;
  const optionalUnanswered = questions.length - resolvedCount - requiredUnanswered;
  const isComplete = requiredUnanswered === 0;

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12" data-testid="workflow-stage-clarify">
      {success && (
        <div className="bg-green-500/10 border border-green-500/30 text-green-700 dark:text-green-300 px-6 py-4 rounded-xl flex items-center gap-3 shadow-sm animate-in fade-in slide-in-from-top-4">
          <CheckCircle2 className="w-5 h-5 text-green-500" />
          <div className="flex-1">
            <h4 className="font-bold">Specification Updated</h4>
            <p className="text-sm opacity-90">Switching you back to the Spec tab to review changes...</p>
          </div>
        </div>
      )}
      
      <div className="mb-8 flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-extrabold mb-2 text-slate-900 dark:text-white">Engineering Decisions</h2>
          <p className="text-slate-600 dark:text-slate-400 text-sm mb-6">
            {questions.length} engineering decisions need your input based on the specification.
          </p>
        </div>
        <div className={`px-4 py-2 rounded-xl border ${ambiguityScore > 70 ? 'bg-red-500/10 border-red-500/30 text-red-700 dark:text-red-400' : ambiguityScore > 40 ? 'bg-yellow-500/10 border-yellow-500/30 text-yellow-700 dark:text-yellow-400' : 'bg-green-500/10 border-green-500/30 text-green-700 dark:text-green-400'}`}>
           <div className="text-xs uppercase font-bold opacity-70">Ambiguity Score</div>
           <div className="text-2xl font-black">{ambiguityScore}%</div>
        </div>
      </div>
      
      <div className="mb-8">
        <div className="flex items-center gap-4">
          <div className="flex-1 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div 
              className="h-full bg-blue-500 transition-all duration-500"
              style={{ width: `${(resolvedCount / questions.length) * 100}%` }}
            />
          </div>
          <span className="text-sm font-bold text-slate-500">{resolvedCount} / {questions.length} resolved</span>
        </div>
        
        {requiredUnanswered > 0 && (
          <div className="mt-3 text-sm text-red-600 dark:text-red-400 font-medium">
            ⚠️ {requiredUnanswered} critical decisions still require your input to proceed.
          </div>
        )}
        {isComplete && optionalUnanswered > 0 && (
          <div className="mt-3 text-sm text-yellow-600 dark:text-yellow-400 font-medium">
            Note: {optionalUnanswered} optional questions are skipped. You can proceed.
          </div>
        )}
      </div>

      <div className="space-y-6">
        {questions.map((q, index) => {
          const isOpen = q.status === "OPEN";
          const isUpdating = updating[q.id];
          
          return (
            <div key={q.id} data-testid="clarification-question" className={`border rounded-2xl p-6 transition-all duration-300 ${isOpen ? 'bg-white dark:bg-[#0f111a] border-blue-200 dark:border-blue-500/30 shadow-md ring-1 ring-blue-500/10' : 'bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 opacity-75'}`}>
              <div className="flex items-start gap-4">
                <div className="mt-1 w-8 h-8 shrink-0 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-full flex items-center justify-center font-bold text-sm">
                  {String(index + 1).padStart(2, '0')}
                </div>
                
                <div className="flex-1">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex flex-col gap-1">
                      <h3 className="font-bold text-lg text-slate-900 dark:text-white">{q.question}</h3>
                      {q.impact?.isRequired && (
                        <span className="text-[10px] uppercase font-bold tracking-wider text-red-500 bg-red-500/10 px-2 py-0.5 rounded w-max">
                          Required Decision
                        </span>
                      )}
                    </div>
                    {!isOpen && (
                      <div className="flex items-center gap-1.5 text-green-600 dark:text-green-500 bg-green-500/10 px-2 py-1 rounded text-xs font-bold uppercase tracking-wider">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Resolved
                      </div>
                    )}
                  </div>
                  
                  {isOpen ? (
                    <div className="space-y-6">
                      {q.options && Array.isArray(q.options) && q.options.length > 0 ? (
                        <div className="grid gap-3">
                          {q.options.map((opt: any) => (
                            <label key={opt.value} className="flex items-start gap-3 p-3 border border-slate-200 dark:border-slate-700 rounded-xl cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors has-[:checked]:border-blue-500 has-[:checked]:bg-blue-50 dark:has-[:checked]:bg-blue-900/20">
                              <input 
                                type="radio" 
                                name={`question-${q.id}`} 
                                value={opt.value} 
                                checked={answers[q.id] === opt.value}
                                onChange={() => setAnswers({ ...answers, [q.id]: opt.value })}
                                className="mt-1 w-4 h-4 text-blue-600 bg-slate-100 border-slate-300 focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-slate-800 focus:ring-2 dark:bg-slate-700 dark:border-slate-600"
                              />
                              <div>
                                <div className="font-semibold text-slate-900 dark:text-white text-sm">{opt.label}</div>
                                {opt.description && <div className="text-xs text-slate-500 mt-1">{opt.description}</div>}
                              </div>
                            </label>
                          ))}
                          <label className="flex items-start gap-3 p-3 border border-slate-200 dark:border-slate-700 rounded-xl cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors has-[:checked]:border-blue-500 has-[:checked]:bg-blue-50 dark:has-[:checked]:bg-blue-900/20">
                            <input 
                              type="radio" 
                              name={`question-${q.id}`} 
                              value="__other__" 
                              checked={!!answers[q.id] && (!q.options.some((o:any) => o.value === answers[q.id]) && !q.options.map((o:any) => o.label).includes(answers[q.id]))}
                              onChange={() => setAnswers({ ...answers, [q.id]: "" })}
                              className="mt-1 w-4 h-4 text-blue-600 bg-slate-100 border-slate-300 focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-slate-800 focus:ring-2 dark:bg-slate-700 dark:border-slate-600"
                            />
                            <div className="w-full">
                              <div className="font-semibold text-slate-900 dark:text-white text-sm">Other / Custom</div>
                              {answers[q.id] !== undefined && (!q.options.some((o:any) => o.value === answers[q.id]) && !q.options.map((o:any) => o.label).includes(answers[q.id])) && (
                                <textarea
                                  value={answers[q.id]}
                                  onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })}
                                  placeholder="Specify your decision..."
                                  className="mt-2 w-full h-20 p-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-900 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                />
                              )}
                            </div>
                          </label>
                        </div>
                      ) : (
                        <textarea
                          value={answers[q.id] || ""}
                          onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })}
                          placeholder="Provide details to clarify..."
                          className="w-full h-24 p-3 border border-slate-200 dark:border-slate-700 rounded-xl resize-none text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:bg-[#05050a]"
                        />
                      )}
                      
                      {q.rationale && (
                        <div className="bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5 p-4 rounded-xl">
                          <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Why this matters</h4>
                          <p className="text-sm text-slate-700 dark:text-slate-300">{q.rationale}</p>
                          {q.impact && (
                             <div className="flex gap-2 mt-3 flex-wrap">
                                {Object.entries(q.impact).map(([key, val]) => {
                                  if (!val || key === 'isRequired') return null;
                                  return (
                                    <span key={key} className="text-[10px] bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 px-2 py-0.5 rounded uppercase font-bold">
                                      {key} impact
                                    </span>
                                  );
                                })}
                             </div>
                          )}
                        </div>
                      )}
                      
                      <div className="flex justify-end pt-2">
                        <button
                          onClick={() => submitAnswer(q.id)}
                          disabled={isUpdating || !answers[q.id]}
                          data-testid="clarification-submit"
                          className="px-6 py-2.5 bg-blue-600 text-white hover:bg-blue-700 rounded-lg font-bold text-sm shadow-md disabled:opacity-50 transition-colors flex items-center gap-2"
                        >
                          {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                          Save Decision →
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="font-medium text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800 px-4 py-3 rounded-lg border border-slate-200 dark:border-slate-700">
                        {q.answer?.answer}
                      </div>
                      <div className="mt-4 flex items-center justify-between text-xs font-bold">
                        <span className="text-slate-400 uppercase tracking-wider">Decision recorded</span>
                        <button className="text-blue-500 hover:text-blue-600 transition-colors">
                          View Decision Intelligence
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-8 pt-8 border-t border-slate-200 dark:border-white/10 flex justify-end gap-4">
        {isComplete && questions.some(q => q.status === "ANSWERED") && (
          <button
            onClick={handleRegenerateSpec}
            disabled={regeneratingSpec}
            className="px-6 py-3 rounded-xl font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 dark:text-blue-300 dark:bg-blue-500/10 dark:hover:bg-blue-500/20 border border-slate-200 dark:border-blue-500/30 disabled:opacity-50 flex items-center gap-2 transition-all"
          >
            {regeneratingSpec ? <Loader2 className="w-5 h-5 animate-spin" /> : <Zap className="w-5 h-5" />}
            {regeneratingSpec ? "Regenerating..." : "Regenerate Spec with Decisions"}
          </button>
        )}
        <button
          onClick={completeClarification}
          disabled={!isComplete}
          data-testid="complete-clarification-button"
          className="px-8 py-3 rounded-xl font-bold text-white bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 disabled:opacity-50 shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5 flex items-center gap-2"
        >
          Complete Phase <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
