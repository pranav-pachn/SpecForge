import { useState } from "react";
import { CheckCircle, ShieldAlert, Zap, Loader2 } from "lucide-react";
import { ValidationSummary } from "./ValidationSummary";
import { ValidationChecks } from "./ValidationChecks";
import { DriftCenter } from "./DriftCenter";
import { DriftSummary } from "./DriftSummary";

interface ValidationWorkspaceProps {
  workflowId: string;
  workflowStatus: string;
  onMutate: () => void;
  onNext: () => void;
  onEditSpec: () => void;
}

export function ValidationWorkspace({ workflowId, workflowStatus, onMutate, onNext, onEditSpec }: ValidationWorkspaceProps) {
  const [showDrift, setShowDrift] = useState(false);
  const [completing, setCompleting] = useState(false);

  const handleComplete = async () => {
    setCompleting(true);
    try {
      await fetch(`/api/workflows/${workflowId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "COMPLETED" }),
      });
      onMutate();
    } catch (e) {
      console.error(e);
    } finally {
      setCompleting(false);
    }
  };

  if (showDrift) {
    return <DriftCenter workflowId={workflowId} onBack={() => setShowDrift(false)} onRevalidate={onMutate} onEditSpec={onEditSpec} />;
  }

  return (
    <div className="h-full flex flex-col bg-slate-50 dark:bg-black overflow-y-auto">
      <div className="max-w-6xl w-full mx-auto p-6 md:p-8 space-y-8">
        
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <CheckCircle className="w-6 h-6 text-emerald-500" />
              Validate
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Can we prove the implementation matches the requirements?
            </p>
          </div>
          
          <button 
            onClick={handleComplete}
            disabled={completing || workflowStatus === "COMPLETED"}
            className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-xl transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {completing ? "Completing..." : workflowStatus === "COMPLETED" ? "Validated" : "Mark as Validated"}
            {completing ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <ValidationSummary />
          </div>
          <div className="lg:col-span-1">
            <DriftSummary onOpenDrift={() => setShowDrift(true)} />
          </div>
        </div>

        <ValidationChecks workflowId={workflowId} />

      </div>
    </div>
  );
}
