"use client";

import { useEffect, useState } from "react";
import { Loader2, ShieldCheck, CheckCircle2, AlertTriangle, XCircle, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";

const CHECK_LABELS: Record<string, string> = {
  REQUIREMENT_COVERAGE: "Requirements Covered",
  TEST_COVERAGE: "Requirements Testable",
  ASSUMPTION_RISK: "Assumptions & Risks Addressed",
  CONSISTENCY: "Consistency & Metrics",
};

export default function ReviewTab({ workflowId, onMutate }: { workflowId: string, onMutate?: () => void }) {
  const router = useRouter();
  const [workflow, setWorkflow] = useState<any>(null);
  const [checks, setChecks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [approving, setApproving] = useState(false);

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
        const chRes = await fetch(`/api/reviews?versionId=${versionId}`);
        const chData = await chRes.json();
        setChecks(chData);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleAnalyze = async () => {
    setAnalyzing(true);
    try {
      const spec = workflow.artifacts?.find((a: any) => a.type === "SPEC");
      await fetch("/api/ai/review-gate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
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
      setAnalyzing(false);
    }
  };

  const handleApprove = async () => {
    setApproving(true);
    try {
      await fetch(`/api/workflows/${workflowId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "PLANNING" }),
      });
      
      // Also generate a Plan artifact placeholder
      await fetch(`/api/artifacts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workflowId, type: "PLAN", title: "Implementation Plan" }),
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
    return <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-slate-400" /></div>;
  }

  const spec = workflow?.artifacts?.find((a: any) => a.type === "SPEC");
  const specVersion = spec?.versions?.[0];

  const isFullReviewMode = workflow?.status === "REVIEWING" || workflow?.status === "VALIDATING" || workflow?.status === "COMPLETED";

  // Prevent accessing review if spec not approved
  if (!isFullReviewMode && (!specVersion || specVersion.status !== "APPROVED")) {
    return (
      <div className="glass border-white/10 border rounded-xl p-12 text-center shadow-sm">
        <ShieldCheck className="w-12 h-12 text-slate-300 mx-auto mb-4" />
        <h3 className="text-xl font-bold mb-2">Spec Not Ready for Review</h3>
        <p className="text-slate-500 mb-6">You must approve the specification and resolve clarifications before reaching the Review Gate.</p>
      </div>
    );
  }

  const handleAnalyzeFull = async () => {
    setAnalyzing(true);
    try {
      await fetch("/api/ai/review", {
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

  const handleApproveFull = async () => {
    setApproving(true);
    try {
      await fetch(`/api/workflows/${workflowId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "VALIDATING" }),
      });
      router.refresh();
      onMutate?.();
    } catch (e) {
      console.error(e);
    } finally {
      setApproving(false);
    }
  };

  if (checks.length === 0) {
    return (
      <div className="glass border-white/10 border rounded-xl p-12 text-center shadow-sm">
        <ShieldCheck className="w-12 h-12 text-purple-500 mx-auto mb-4" />
        <h3 className="text-xl font-bold mb-2">
          {isFullReviewMode ? "Full Pipeline Review" : "Spec Review Gate"}
        </h3>
        <p className="text-slate-500 mb-6 max-w-lg mx-auto">
          {isFullReviewMode 
            ? "Run a comprehensive check across your Spec, Plan, and Tasks to catch inconsistencies or missing coverage before execution."
            : "Before creating an implementation plan, we enforce a strict quality check on the specification to ensure nothing is missed."}
        </p>
        <button
          onClick={isFullReviewMode ? handleAnalyzeFull : handleAnalyze}
          disabled={analyzing}
          className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2.5 rounded-md font-medium inline-flex items-center gap-2 transition-colors"
        >
          {analyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
          Run Review Checks
        </button>
      </div>
    );
  }

  const allPassed = checks.every(c => c.status === "PASSED");
  const failCount = checks.filter(c => c.status === "FAILED").length;
  const warnCount = checks.filter(c => c.status === "PENDING" && c.type === "CONSISTENCY").length;
  
  // Is this the full review results or spec review results?
  // We can tell by check type. Full review uses CONSISTENCY with complex description.
  const isShowingFullReview = checks.some(c => c.type === "CONSISTENCY" && c.description.startsWith("["));

  return (
    <div className="glass border-white/10 border rounded-xl shadow-sm overflow-hidden">
      <div className="bg-white/5 border-b px-6 py-5 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-purple-500" />
            {isShowingFullReview ? "Full Pipeline Review Results" : "Review Gate Results"}
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            {failCount > 0 
              ? `${failCount} blockers found. You must resolve these before proceeding.`
              : isShowingFullReview ? `All clear! (${warnCount} warnings)` : "All checks passed. The spec is ready for planning."}
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={isFullReviewMode ? handleAnalyzeFull : handleAnalyze}
            disabled={analyzing}
            className="px-4 py-2 text-sm font-medium text-slate-600 glass border-white/20 rounded-md hover:bg-white/10 text-white disabled:opacity-50 flex items-center gap-2"
          >
            {analyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : "Re-run Checks"}
          </button>
          
          <button
            onClick={isFullReviewMode ? handleApproveFull : handleApprove}
            disabled={approving || failCount > 0}
            className="px-5 py-2 rounded-md font-medium text-white bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-sm transition-colors"
          >
            Approve & Continue <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="p-6">
        <div className="grid gap-4">
          {checks.map(check => {
            const isPass = check.status === "PASSED";
            const isFail = check.status === "FAILED";
            const isWarn = check.status === "PENDING"; // used for warnings in Full Review
            
            return (
              <div 
                key={check.id} 
                className={`flex gap-4 p-4 rounded-lg border ${
                  isPass ? 'border-green-200 bg-green-50 dark:border-green-900/30 dark:bg-green-900/10' :
                  isWarn ? 'border-yellow-200 bg-yellow-50 dark:border-yellow-900/30 dark:bg-yellow-900/10' :
                  'border-red-200 bg-red-50 dark:border-red-900/30 dark:bg-red-900/10'
                }`}
              >
                <div className="mt-0.5">
                  {isPass ? <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-500" /> :
                   isWarn ? <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-500" /> :
                   <XCircle className="w-5 h-5 text-red-600 dark:text-red-500" />}
                </div>
                <div>
                  <h4 className="font-semibold text-slate-900 dark:text-slate-100">
                    {isShowingFullReview ? (isFail ? "BLOCKER" : isWarn ? "WARNING" : "INFO") : (CHECK_LABELS[check.type] || check.type)}
                  </h4>
                  <p className="text-sm mt-1 text-slate-600 dark:text-slate-400 font-medium">
                    {check.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
