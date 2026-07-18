"use client";

import { useEffect, useState } from "react";
import { Loader2, ClipboardCheck, ArrowRight, ShieldCheck, RefreshCw, Wand2, CheckCircle2, FileText, Edit } from "lucide-react";
import { useRouter } from "next/navigation";
import ValidationScoreHero from "../validation/ValidationScoreHero";
import ValidationCategoryCard from "../validation/ValidationCategoryCard";

export default function ValidateTab({ workflowId, onMutate, onNext, onEditSpec }: { workflowId: string, onMutate?: () => void, onNext?: () => void, onEditSpec?: () => void }) {
  const router = useRouter();
  const [workflow, setWorkflow] = useState<any>(null);
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [validating, setValidating] = useState(false);
  const [completing, setCompleting] = useState(false);

  useEffect(() => {
    fetchData();
  }, [workflowId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [wfRes, repRes] = await Promise.all([
        fetch(`/api/workflows/${workflowId}`),
        fetch(`/api/validation-reports?workflowId=${workflowId}`)
      ]);
      const [wfData, repData] = await Promise.all([wfRes.json(), repRes.json()]);
      setWorkflow(wfData);
      setReport(repData);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleValidate = async () => {
    setValidating(true);
    try {
      await fetch("/api/ai/validation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workflowId }),
      });
      await fetchData();
      router.refresh();
      onMutate?.();
    } catch (e) {
      console.error(e);
    } finally {
      setValidating(false);
    }
  };

  const handleComplete = async () => {
    if (report?.overallScore < 80) return;
    setCompleting(true);
    try {
      const nextStatus = workflow?.status === "COMPLETED" ? "ARCHIVED" : "COMPLETED";
      await fetch(`/api/workflows/${workflowId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      router.refresh();
      onMutate?.();
    } catch (e) {
      console.error(e);
    } finally {
      setCompleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-20 gap-4">
        <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
        <p className="text-sm text-slate-500 animate-pulse">Loading validation report...</p>
      </div>
    );
  }

  // Empty state — no report yet
  if (!report) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-8 text-center glass border border-dashed border-white/10 rounded-2xl">
        <div className="w-20 h-20 bg-gradient-to-br from-purple-50 to-indigo-100 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-2xl flex items-center justify-center mb-6 shadow-sm">
          <ClipboardCheck className="w-10 h-10 text-purple-600 dark:text-purple-400" />
        </div>
        <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-3">Validation Engine</h3>
        <p className="text-slate-500 dark:text-slate-400 mb-8 max-w-md leading-relaxed">
          Verify that the implementation plan and generated tasks fully satisfy the original approved specification without losing any requirements.
        </p>
        <div className="flex flex-wrap gap-4 justify-center text-xs text-slate-400 mb-8">
          {['Coverage', 'Task Mapping', 'Acceptance Criteria', 'Execution Packs', 'Dependencies', 'Duplicates'].map(cat => (
            <span key={cat} className="px-3 py-1.5 border border-white/10 rounded-full font-medium">
              {cat}
            </span>
          ))}
        </div>
        <button
          onClick={handleValidate}
          disabled={validating}
          className="group relative inline-flex items-center gap-3 px-8 py-3.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold shadow-lg shadow-purple-500/20 hover:shadow-purple-500/40 transition-all duration-200 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {validating ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Validating Artifacts...
            </>
          ) : (
            <>
              <Wand2 className="w-5 h-5" />
              Run Validation Engine
            </>
          )}
        </button>
      </div>
    );
  }

  const parseData = (str: string) => {
    try { return str ? JSON.parse(str) : null; } catch { return null; }
  };

  const categories = [
    { id: 'coverage',    title: 'Requirement Coverage', score: report.coverageScore,    data: parseData(report.coverageData),    icon: '📋' },
    { id: 'taskMapping', title: 'Task Mapping',         score: report.taskMappingScore, data: parseData(report.taskMappingData), icon: '🔗' },
    { id: 'acceptance',  title: 'Acceptance Criteria',  score: report.acceptanceScore,  data: parseData(report.acceptanceData),  icon: '✅' },
    { id: 'execution',   title: 'Execution Packs',      score: report.executionScore,   data: parseData(report.executionData),   icon: '📦' },
    { id: 'dependency',  title: 'Dependencies',         score: report.dependencyScore,  data: parseData(report.dependencyData),  icon: '🕸️' },
    { id: 'duplicate',   title: 'Duplicate Tasks',      score: report.duplicateScore,   data: parseData(report.duplicateData),   icon: '👯' },
  ];

  const isReady = report.overallScore >= 80;
  const missingRequirements = report.issues?.filter((i: any) => i.severity === 'critical' && !i.taskId).length ?? 0;

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2.5">
            <ClipboardCheck className="w-6 h-6 text-purple-500" />
            Validation Results
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            {missingRequirements > 0
              ? `${missingRequirements} critical traceabilitiy issue${missingRequirements > 1 ? 's' : ''} found — generate fixes to proceed`
              : isReady
              ? 'All requirements are traced and tasks mapped. Ready for development.'
              : 'Review validation issues and generate missing tasks to proceed.'}
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={handleValidate}
            disabled={validating}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-slate-300 glass border-white/10 border border-white/10 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95 shadow-sm"
          >
            {validating ? (
              <><Loader2 className="w-4 h-4 animate-spin" />Re-validating...</>
            ) : (
              <><RefreshCw className="w-4 h-4" />Re-run Validation</>
            )}
          </button>
        </div>
      </div>

      <ValidationScoreHero report={report} />

      <div className="grid gap-4 md:grid-cols-2">
        {categories.map(cat => (
          <ValidationCategoryCard
            key={cat.id}
            title={cat.title}
            emoji={cat.icon}
            score={cat.score}
            data={cat.data}
            issues={report.issues?.filter((i: any) => i.category === cat.id) ?? []}
            onFixGenerated={fetchData}
          />
        ))}
      </div>

      <div className="p-6 border-t border-white/10 mt-8">
        <div className="glass-panel p-6 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-green-500/20 bg-green-500/5 shadow-[0_0_20px_rgba(34,197,94,0.1)]">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle2 className="w-6 h-6 text-green-500" />
              <h3 className="text-xl font-bold text-white">Validation Complete</h3>
            </div>
            <p className="text-sm text-slate-400">
              {report ? `Everything traces back correctly with a validation score of ${report.overallScore}/100. ${missingRequirements === 0 ? "No critical traceability issues found." : `${missingRequirements} critical issues remaining.`}` : 'Everything traces back correctly.'} You can now complete the workflow or make further spec edits.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onEditSpec}
              className="px-5 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold flex items-center gap-2 transition-all border border-slate-700 hover:border-slate-600"
            >
              <Edit className="w-5 h-5" /> Edit Spec
            </button>
            {workflow?.status !== 'COMPLETED' && workflow?.status !== 'ARCHIVED' && (
              <button
                onClick={() => {
                  handleComplete();
                  if (onNext) onNext();
                }}
                disabled={!isReady || completing}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white rounded-xl font-bold flex items-center gap-2 transition-all hover:shadow-[0_0_15px_rgba(37,99,235,0.4)]"
              >
                Complete Workflow <ArrowRight className="w-5 h-5" />
              </button>
            )}
            {(workflow?.status === 'COMPLETED' || workflow?.status === 'ARCHIVED') && (
              <button
                onClick={onNext}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold flex items-center gap-2 transition-all hover:shadow-[0_0_15px_rgba(37,99,235,0.4)]"
              >
                Go to Drift Dashboard <ArrowRight className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
