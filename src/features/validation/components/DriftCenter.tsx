import React, { useState, useEffect } from "react";
import { ArrowLeft, AlertTriangle, CheckCircle, Loader2 } from "lucide-react";
import { DriftImpactGraph } from "./DriftImpactGraph";
import { RepairPreview } from "./RepairPreview";

interface DriftCenterProps {
  workflowId?: string;
  onBack: () => void;
  onRevalidate: () => void;
  onEditSpec: () => void;
}

export function DriftCenter({ workflowId, onBack, onRevalidate, onEditSpec }: DriftCenterProps) {
  const [state, setState] = useState<"LOADING" | "IDLE" | "IMPACT" | "REPAIRING" | "RESOLVED">("LOADING");
  const [drifts, setDrifts] = useState<any[]>([]);

  useEffect(() => {
    if (!workflowId) return;
    fetch(`/api/workflows/${workflowId}/drift`)
      .then(res => res.json())
      .then(data => {
        setDrifts(data.drifts || []);
        if (data.drifts && data.drifts.length > 0) {
          setState("IMPACT");
        } else {
          setState("IDLE");
        }
      })
      .catch(err => {
        console.error(err);
        setState("IDLE");
      });
  }, [workflowId]);

  const handleApplyRepair = async () => {
    setState("REPAIRING");
    try {
      await fetch(`/api/workflows/${workflowId}/repair`, { method: "POST" });
      setState("RESOLVED");
      onRevalidate();
    } catch (e) {
      console.error(e);
      setState("IMPACT");
    }
  };

  return (
    <div className="h-full flex flex-col bg-slate-50 dark:bg-black overflow-y-auto">
      <div className="max-w-6xl w-full mx-auto p-6 md:p-8 space-y-8 flex flex-col h-full">
        
        {/* Header */}
        <div className="flex items-center gap-4">
          <button 
            onClick={onBack}
            className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-slate-500" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <AlertTriangle className="w-6 h-6 text-red-500" />
              Drift Center
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Impact analysis for specification changes
            </p>
          </div>
        </div>

        {state === "LOADING" && (
          <div className="flex-1 flex flex-col items-center justify-center">
            <Loader2 className="w-12 h-12 text-blue-500 animate-spin mb-4" />
            <p className="text-slate-500">Checking for drift events...</p>
          </div>
        )}

        {state === "IDLE" && (
          <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl p-12">
            <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-6">
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">No Drift Detected</h2>
            <p className="text-slate-500 dark:text-slate-400 text-center max-w-md mb-8">
              Your specification and implementation are fully in sync. No impact analysis or repair is needed.
            </p>
          </div>
        )}

        {state === "IMPACT" && (
          <>
            <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
                <div>
                  <h3 className="text-sm font-bold text-red-900 dark:text-red-100">{drifts.length} DRIFT EVENTS DETECTED</h3>
                  <p className="text-xs text-red-700 dark:text-red-300 mt-0.5">
                    {drifts.filter(d => d.entityType === "TASK").length} tasks and {drifts.filter(d => d.entityType === "PACK").length} packs affected
                  </p>
                </div>
              </div>
            </div>

            <div className="flex-1 min-h-[400px] border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden bg-white dark:bg-slate-900/50">
              <DriftImpactGraph />
            </div>

            <RepairPreview onApply={handleApplyRepair} />
          </>
        )}

        {state === "REPAIRING" && (
          <div className="flex-1 flex flex-col items-center justify-center">
            <div className="w-16 h-16 border-4 border-slate-200 border-t-indigo-500 rounded-full animate-spin mb-4" />
            <p className="text-sm font-bold text-slate-500 animate-pulse">Applying targeted repair and regenerating artifacts...</p>
          </div>
        )}

        {state === "RESOLVED" && (
          <div className="flex-1 flex flex-col items-center justify-center border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-3xl p-12 text-center">
            <div className="w-20 h-20 bg-green-50 dark:bg-green-500/10 rounded-full flex items-center justify-center mb-6">
              <CheckCircle className="w-10 h-10 text-green-500" />
            </div>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-2">Drift Resolved</h2>
            <p className="text-slate-500 dark:text-slate-400 mb-8 max-w-md">
              The affected artifacts have been successfully regenerated and revalidated against the updated specification.
            </p>
            <button 
              onClick={onBack}
              className="px-6 py-2.5 bg-slate-900 dark:bg-white text-white dark:text-black text-sm font-bold rounded-xl transition-all hover:opacity-90"
            >
              Return to Validation
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
