import { useState } from "react";
import { CheckCircle, ShieldCheck, Loader2 } from "lucide-react";
import { RequirementCoverage } from "./RequirementCoverage";
import { ReviewSummary } from "./ReviewSummary";
import { ReviewFindings } from "./ReviewFindings";

interface ReviewWorkspaceProps {
  workflowId: string;
  workflowStatus: string;
  onMutate: () => void;
  onNext: () => void;
}

export function ReviewWorkspace({ workflowId, workflowStatus, onMutate, onNext }: ReviewWorkspaceProps) {
  const [proceeding, setProceeding] = useState(false);

  const handleProceed = async () => {
    setProceeding(true);
    try {
      await fetch(`/api/workflows/${workflowId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "VALIDATING" }),
      });
      onMutate();
      onNext();
    } catch (e) {
      console.error(e);
    } finally {
      setProceeding(false);
    }
  };

  return (
    <div className="h-full flex flex-col bg-slate-50 dark:bg-black overflow-y-auto">
      <div className="max-w-6xl w-full mx-auto p-6 md:p-8 space-y-8">
        
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <ShieldCheck className="w-6 h-6 text-indigo-500" />
              Review
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Is the implementation aligned with the approved specification?
            </p>
          </div>
          
          <button 
            onClick={handleProceed}
            disabled={proceeding}
            className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl transition-all shadow-sm disabled:opacity-50"
          >
            {proceeding ? "Proceeding..." : "Proceed to Validation"}
            {proceeding ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
          </button>
        </div>

        {/* Top-level summary metrics */}
        <ReviewSummary />

        {/* Central visual traceability */}
        <RequirementCoverage workflowId={workflowId} />

        {/* Structured findings mapping to artifacts */}
        <ReviewFindings workflowId={workflowId} />

      </div>
    </div>
  );
}
