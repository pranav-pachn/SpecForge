"use client";

import { useEffect, useState } from "react";
import { Loader2, ClipboardCheck, ArrowRight, ShieldCheck, RefreshCw, Wand2 } from "lucide-react";
import { useRouter } from "next/navigation";
import ValidationScoreHero from "../validation/ValidationScoreHero";
import ValidationCategoryCard from "../validation/ValidationCategoryCard";

export default function ValidateTab({ workflowId, onMutate }: { workflowId: string, onMutate?: () => void }) {
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

          <div className="relative group">
            {workflow?.status !== 'ARCHIVED' && (
              <button
                onClick={handleComplete}
                disabled={completing || !isReady}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 disabled:from-slate-400 disabled:to-slate-500 disabled:cursor-not-allowed shadow-lg shadow-purple-500/20 hover:shadow-purple-500/40 disabled:shadow-none transition-all active:scale-95"
              >
                {completing ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <ShieldCheck className="w-4 h-4" />
                )}
                {completing 
                  ? (workflow?.status === 'COMPLETED' ? 'Archiving...' : 'Completing...') 
                  : (workflow?.status === 'COMPLETED' ? 'Archive Workflow' : 'Complete Workflow')}
                {!completing && <ArrowRight className="w-4 h-4" />}
              </button>
            )}
            {workflow?.status === 'ARCHIVED' && (
              <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm text-slate-400 bg-slate-800 border border-slate-700 shadow-none cursor-not-allowed">
                <ShieldCheck className="w-4 h-4" />
                Workflow Archived
              </div>
            )}

            {!isReady && !completing && (
              <div className="absolute bottom-full right-0 mb-2 px-3 py-2 bg-slate-900 text-white text-xs rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-xl z-10">
                Score must be ≥ 80 to complete
                <div className="absolute top-full right-4 border-4 border-transparent border-t-slate-900" />
              </div>
            )}
          </div>
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
    </div>
  );
}
