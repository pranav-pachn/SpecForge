"use client";

import { useEffect, useState } from "react";
import { Loader2, ShieldCheck, ArrowRight, Activity, RefreshCw, Wand2 } from "lucide-react";
import { useRouter } from "next/navigation";
import EngineeringScoreHero from "../review/EngineeringScoreHero";
import EngineeringCategoryCard from "../review/EngineeringCategoryCard";
import EngineeringFindingRow from "@/features/workflows/components/review/EngineeringFindingRow";
import { SkeletonTable } from "@/components/ui/Skeleton";

export default function EngineeringReviewTab({ workflowId, onMutate }: { workflowId: string, onMutate?: () => void }) {
  const router = useRouter();
  const [workflow, setWorkflow] = useState<any>(null);
  const [review, setReview] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [approving, setApproving] = useState(false);

  useEffect(() => {
    fetchData();
  }, [workflowId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [wfRes, revRes] = await Promise.all([
        fetch(`/api/workflows/${workflowId}`),
        fetch(`/api/engineering-reviews?workflowId=${workflowId}`)
      ]);
      const [wfData, revData] = await Promise.all([wfRes.json(), revRes.json()]);
      setWorkflow(wfData);
      setReview(revData);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleAnalyze = async () => {
    setAnalyzing(true);
    try {
      await fetch("/api/ai/engineering-review", {
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
      setAnalyzing(false);
    }
  };

  const handleApprove = async () => {
    if (review?.overallScore < 80) return;
    setApproving(true);
    try {
      await fetch(`/api/workflows/${workflowId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "REVIEWING" }),
      });
      router.refresh();
      onMutate?.();
    } catch (e) {
      console.error(e);
    } finally {
      setApproving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <SkeletonTable rows={4} />
      </div>
    );
  }

  // Empty state — no review yet
  if (!review) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-8 text-center glass border border-dashed border-white/10 rounded-2xl">
        <div className="w-20 h-20 bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-2xl flex items-center justify-center mb-6 shadow-sm">
          <Activity className="w-10 h-10 text-blue-600 dark:text-blue-400" />
        </div>
        <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-3">Engineering Review</h3>
        <p className="text-slate-500 dark:text-slate-400 mb-8 max-w-md leading-relaxed">
          Run a comprehensive check across your implementation plan and tasks to catch missing tests, security vulnerabilities, and performance risks before execution.
        </p>
        <div className="flex flex-wrap gap-4 justify-center text-xs text-slate-400 mb-8">
          {['Coverage', 'Testing', 'Security', 'Performance', 'Architecture', 'Deployment', 'Rollback'].map(cat => (
            <span key={cat} className="px-3 py-1.5 border border-white/10 rounded-full font-medium">
              {cat}
            </span>
          ))}
        </div>
        <button
          onClick={handleAnalyze}
          disabled={analyzing}
          className="group relative inline-flex items-center gap-3 px-8 py-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 transition-all duration-200 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {analyzing ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Analyzing your project...
            </>
          ) : (
            <>
              <Wand2 className="w-5 h-5" />
              Run Engineering Review
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
    { id: 'coverage',     title: 'Requirements Coverage', score: review.coverageScore,     data: parseData(review.coverageData),     icon: '📋' },
    { id: 'testing',      title: 'Testing & QA',           score: review.testingScore,       data: parseData(review.testingData),       icon: '🧪' },
    { id: 'security',     title: 'Security',                score: review.securityScore,      data: parseData(review.securityData),      icon: '🔒' },
    { id: 'performance',  title: 'Performance',             score: review.performanceScore,   data: parseData(review.performanceData),   icon: '⚡' },
    { id: 'architecture', title: 'Architecture',            score: review.architectureScore,  data: parseData(review.architectureData),  icon: '🏗️' },
    { id: 'deployment',   title: 'Deployment Readiness',   score: review.deploymentScore,    data: parseData(review.deploymentData),    icon: '🚀' },
    { id: 'rollback',     title: 'Rollback Strategy',      score: review.rollbackScore,      data: parseData(review.rollbackData),      icon: '↩️' },
  ];

  const isReadyToBuild = review.overallScore >= 80;
  const criticalFindings = review.findings?.filter((f: any) => f.severity === 'critical' && !f.taskId).length ?? 0;

  return (
    <div className="space-y-8">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2.5">
            <Activity className="w-6 h-6 text-blue-500" />
            Engineering Review
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            {criticalFindings > 0
              ? `${criticalFindings} critical issue${criticalFindings > 1 ? 's' : ''} remaining — generate fixes to proceed`
              : isReadyToBuild
              ? 'All checks passed. Your project is ready for development.'
              : 'Review your results and address warnings before proceeding.'}
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={handleAnalyze}
            disabled={analyzing}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-slate-300 glass border-white/10 border border-white/10 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95 shadow-sm"
          >
            {analyzing ? (
              <><Loader2 className="w-4 h-4 animate-spin" />Re-analyzing...</>
            ) : (
              <><RefreshCw className="w-4 h-4" />Re-run Review</>
            )}
          </button>

          <div className="relative group">
            <button
              onClick={handleApprove}
              disabled={approving || !isReadyToBuild}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:from-slate-400 disabled:to-slate-500 disabled:cursor-not-allowed shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 disabled:shadow-none transition-all active:scale-95"
            >
              {approving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <ShieldCheck className="w-4 h-4" />
              )}
              {approving ? 'Approving...' : 'Approve & Proceed'}
              {!approving && <ArrowRight className="w-4 h-4" />}
            </button>

            {/* Tooltip when disabled */}
            {!isReadyToBuild && !approving && (
              <div className="absolute bottom-full right-0 mb-2 px-3 py-2 bg-slate-900 text-white text-xs rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-xl z-10">
                Score must be ≥ 80 to proceed
                <div className="absolute top-full right-4 border-4 border-transparent border-t-slate-900" />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Score Hero */}
      <EngineeringScoreHero review={review} />

      {/* Category Cards — 2 column grid, last card (rollback) full width if odd */}
      <div className="grid gap-4 md:grid-cols-2">
        {categories.map(cat => (
          <EngineeringCategoryCard
            key={cat.id}
            title={cat.title}
            emoji={cat.icon}
            score={cat.score}
            data={cat.data}
            findings={review.findings?.filter((f: any) => f.category === cat.id) ?? []}
            onFixGenerated={fetchData}
          />
        ))}
      </div>

    </div>
  );
}
