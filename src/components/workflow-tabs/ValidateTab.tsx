"use client";

import { useEffect, useState } from "react";
import { Loader2, ClipboardCheck, CheckCircle2, XCircle, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";

export default function ValidateTab({ workflowId }: { workflowId: string }) {
  const router = useRouter();
  const [workflow, setWorkflow] = useState<any>(null);
  const [checks, setChecks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [validating, setValidating] = useState(false);
  const [completing, setCompleting] = useState(false);

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
        const chRes = await fetch(`/api/ai/validation?versionId=${versionId}`);
        const chData = await chRes.json();
        setChecks(chData || []);
      }
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
    } catch (e) {
      console.error(e);
    } finally {
      setValidating(false);
    }
  };

  const handleComplete = async () => {
    setCompleting(true);
    try {
      await fetch(`/api/workflows/${workflowId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "COMPLETED" }),
      });
      router.refresh();
    } catch (e) {
      console.error(e);
    } finally {
      setCompleting(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-slate-400" /></div>;
  }

  if (checks.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-950 border rounded-xl p-12 text-center shadow-sm">
        <ClipboardCheck className="w-12 h-12 text-indigo-500 mx-auto mb-4" />
        <h3 className="text-xl font-bold mb-2">Final Validation</h3>
        <p className="text-slate-500 mb-6 max-w-lg mx-auto">
          Verify that the implementation plan and tasks fully satisfy the original approved specification.
        </p>
        <button
          onClick={handleValidate}
          disabled={validating}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-md font-medium inline-flex items-center gap-2 transition-colors"
        >
          {validating ? <Loader2 className="w-4 h-4 animate-spin" /> : <ClipboardCheck className="w-4 h-4" />}
          Run Validation Checks
        </button>
      </div>
    );
  }

  const allPassed = checks.every(c => c.status === "PASSED");
  const passedCount = checks.filter(c => c.status === "PASSED").length;
  const categories = Array.from(new Set(checks.map(c => c.category)));

  return (
    <div className="bg-white dark:bg-slate-950 border rounded-xl shadow-sm overflow-hidden">
      <div className="bg-slate-50 dark:bg-slate-900 border-b px-6 py-5 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <ClipboardCheck className="w-6 h-6 text-indigo-500" />
            Validation Results
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            {passedCount} of {checks.length} checks passed.
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={handleValidate}
            disabled={validating}
            className="px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-300 rounded-md hover:bg-slate-50 disabled:opacity-50 flex items-center gap-2"
          >
            {validating ? <Loader2 className="w-4 h-4 animate-spin" /> : "Re-run Validation"}
          </button>
          
          <button
            onClick={handleComplete}
            disabled={completing || !allPassed}
            className="px-5 py-2 rounded-md font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-sm transition-colors"
          >
            Complete Workflow <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="p-6">
        <div className="space-y-8">
          {categories.map(category => (
            <div key={category || 'Uncategorized'}>
              <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4 border-b pb-2">
                {category || "General"}
              </h3>
              <div className="grid gap-3">
                {checks.filter(c => c.category === category).map(check => {
                  const isPass = check.status === "PASSED";
                  
                  return (
                    <div 
                      key={check.id} 
                      className={`flex gap-3 p-3 rounded-lg border ${
                        isPass ? 'border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900' :
                        'border-red-200 bg-red-50 dark:border-red-900/30 dark:bg-red-900/10'
                      }`}
                    >
                      <div className="mt-0.5 shrink-0">
                        {isPass ? <CheckCircle2 className="w-5 h-5 text-green-500" /> :
                         <XCircle className="w-5 h-5 text-red-500" />}
                      </div>
                      <div>
                        <h4 className="font-medium text-slate-900 dark:text-slate-100 text-sm">
                          {check.criteria}
                        </h4>
                        {check.resultNotes && (
                          <p className={`text-sm mt-1 ${isPass ? 'text-slate-500' : 'text-red-700 dark:text-red-400 font-medium'}`}>
                            {check.resultNotes}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
