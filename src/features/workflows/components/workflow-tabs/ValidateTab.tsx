"use client";

import { useEffect, useState } from "react";
import { Loader2, ArrowRight, ShieldCheck, RefreshCw, Wand2, CheckCircle2, AlertTriangle, FileCode, Search, Server, Database, Hammer, Wrench } from "lucide-react";
import { useRouter } from "next/navigation";
import ValidationScoreHero from "../validation/ValidationScoreHero";

export default function ValidateTab({ workflowId, onMutate, onNext, onEditSpec, onReviewChanges }: { workflowId: string, onMutate?: () => void, onNext?: () => void, onEditSpec?: () => void, onReviewChanges?: () => void }) {
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
    if (report?.recommendation !== "SAFE_TO_APPLY") return;
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
      if (onNext) onNext();
    } catch (e) {
      console.error(e);
    } finally {
      setCompleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-20 gap-4">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        <p className="text-sm text-slate-500 animate-pulse">Loading validation report...</p>
      </div>
    );
  }

  // Empty state — no report yet
  if (!report) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-8 text-center glass border border-dashed border-white/10 rounded-2xl">
        <div className="w-20 h-20 bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-2xl flex items-center justify-center mb-6 shadow-sm">
          <ShieldCheck className="w-10 h-10 text-blue-600 dark:text-blue-400" />
        </div>
        <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-3">Product Validation</h3>
        <p className="text-slate-500 dark:text-slate-400 mb-8 max-w-md leading-relaxed">
          Verify execution evidence, assess risk, and determine if the changes are safe to apply.
        </p>
        <button
          onClick={handleValidate}
          disabled={validating}
          className="group relative inline-flex items-center gap-3 px-8 py-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 transition-all duration-200 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {validating ? (
            <><Loader2 className="w-5 h-5 animate-spin" /> Analyzing...</>
          ) : (
            <><Wand2 className="w-5 h-5" /> Run Validation Engine</>
          )}
        </button>
      </div>
    );
  }

  const { impact, evaluation, repairs, evidence } = report;

  return (
    <div className="space-y-8 max-w-4xl mx-auto pb-12">
      <ValidationScoreHero report={report} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Left Column: Impact & Evaluation */}
        <div className="space-y-8">
          
          <section className="glass rounded-xl p-6 border border-white/5">
            <h4 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-6 flex items-center gap-2">
              <Activity className="w-4 h-4" /> Execution Impact
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-black/20 p-4 rounded-lg flex items-center gap-4 border border-white/5">
                <FileCode className="w-8 h-8 text-blue-400 opacity-50" />
                <div>
                  <div className="text-2xl font-black text-slate-200">{impact.files}</div>
                  <div className="text-xs font-bold text-slate-500 uppercase tracking-widest">Files</div>
                </div>
              </div>
              <div className="bg-black/20 p-4 rounded-lg flex items-center gap-4 border border-white/5">
                <Server className="w-8 h-8 text-indigo-400 opacity-50" />
                <div>
                  <div className="text-2xl font-black text-slate-200">{impact.services}</div>
                  <div className="text-xs font-bold text-slate-500 uppercase tracking-widest">Services</div>
                </div>
              </div>
              <div className="bg-black/20 p-4 rounded-lg flex items-center gap-4 border border-white/5">
                <Search className="w-8 h-8 text-purple-400 opacity-50" />
                <div>
                  <div className="text-2xl font-black text-slate-200">{impact.apis}</div>
                  <div className="text-xs font-bold text-slate-500 uppercase tracking-widest">APIs</div>
                </div>
              </div>
              <div className="bg-black/20 p-4 rounded-lg flex items-center gap-4 border border-white/5">
                <Database className="w-8 h-8 text-orange-400 opacity-50" />
                <div>
                  <div className="text-2xl font-black text-slate-200">{impact.databaseChanges}</div>
                  <div className="text-xs font-bold text-slate-500 uppercase tracking-widest">DB Changes</div>
                </div>
              </div>
            </div>
          </section>

          <section className="glass rounded-xl p-6 border border-white/5">
            <h4 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-6 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4" /> Evaluation
            </h4>
            <div className="space-y-4">
              {Object.entries(evaluation).map(([key, val]: any) => (
                <div key={key} className="flex items-center justify-between p-3 rounded-lg bg-black/20 border border-white/5">
                  <span className="text-sm font-medium text-slate-300 capitalize">{key}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-slate-500">{val.score}%</span>
                    {val.passed ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <AlertTriangle className="w-4 h-4 text-red-500" />}
                  </div>
                </div>
              ))}
            </div>
          </section>

        </div>

        {/* Right Column: Repairs & Evidence */}
        <div className="space-y-8">
          
          <section className="glass rounded-xl p-6 border border-white/5">
            <h4 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-6 flex items-center gap-2">
              <Wrench className="w-4 h-4" /> Repair History
            </h4>
            
            <div className="flex items-center gap-6 mb-6">
              <div>
                <div className="text-3xl font-black text-slate-200">{repairs.total}</div>
                <div className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Cycles</div>
              </div>
              <div>
                <div className="text-3xl font-black text-green-400">{repairs.successful}</div>
                <div className="text-[10px] uppercase tracking-widest text-green-500/70 font-bold">Successful</div>
              </div>
              <div>
                <div className="text-3xl font-black text-slate-600">{repairs.failed}</div>
                <div className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Unresolved</div>
              </div>
            </div>

            <div className="space-y-4">
              {repairs.history.map((rep: any, idx: number) => (
                <div key={idx} className="p-4 rounded-lg bg-black/30 border border-white/5 text-sm space-y-3">
                  <div className="flex justify-between items-start">
                    <div className="font-bold text-slate-300">Repair #{idx + 1}</div>
                    <div className="text-xs font-bold text-green-400 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> {rep.result}</div>
                  </div>
                  
                  <div>
                    <div className="text-[10px] uppercase tracking-widest text-slate-500 mb-1">Issue</div>
                    <div className="text-slate-400">{rep.issue}</div>
                  </div>
                  
                  <div>
                    <div className="text-[10px] uppercase tracking-widest text-slate-500 mb-1">Action</div>
                    <div className="text-slate-400">{rep.action}</div>
                  </div>
                  
                  <div>
                    <div className="text-[10px] uppercase tracking-widest text-slate-500 mb-1">Files</div>
                    <div className="font-mono text-xs text-blue-400">{rep.files.join(", ")}</div>
                  </div>

                  <div className="pt-2 flex items-center gap-3">
                     <button onClick={onReviewChanges} className="text-xs font-bold text-indigo-400 hover:text-indigo-300">View Diff</button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="glass rounded-xl p-6 border border-white/5">
            <h4 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-6 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" /> Validation Evidence
            </h4>
            <div className="space-y-3">
               <div className="flex items-center justify-between p-3 rounded-lg bg-black/20 border border-white/5 hover:bg-black/40 transition-colors cursor-pointer" onClick={onEditSpec}>
                 <span className="text-sm font-medium text-slate-300">Requirements Covered</span>
                 <div className="flex items-center gap-2">
                   <span className="text-xs font-bold text-slate-400">{evidence.requirements}</span>
                   <CheckCircle2 className="w-4 h-4 text-green-500" />
                 </div>
               </div>
               
               <div className="flex items-center justify-between p-3 rounded-lg bg-black/20 border border-white/5 hover:bg-black/40 transition-colors cursor-pointer" onClick={() => {}}>
                 <span className="text-sm font-medium text-slate-300">Tasks Evaluated</span>
                 <div className="flex items-center gap-2">
                   <span className="text-xs font-bold text-slate-400">{evidence.tasks}</span>
                   <CheckCircle2 className="w-4 h-4 text-green-500" />
                 </div>
               </div>

               <div className="flex items-center justify-between p-3 rounded-lg bg-black/20 border border-white/5 hover:bg-black/40 transition-colors cursor-pointer" onClick={onReviewChanges}>
                 <span className="text-sm font-medium text-slate-300">Files Analyzed</span>
                 <div className="flex items-center gap-2">
                   <span className="text-xs font-bold text-slate-400">{evidence.files}</span>
                   <CheckCircle2 className="w-4 h-4 text-green-500" />
                 </div>
               </div>
               
               <div className="flex items-center justify-between p-3 rounded-lg bg-black/20 border border-white/5">
                 <span className="text-sm font-medium text-slate-300">Critical Checks</span>
                 <div className="flex items-center gap-2">
                   <span className="text-xs font-bold text-green-400">{evidence.checks}</span>
                 </div>
               </div>
            </div>
          </section>

        </div>
      </div>
      
      {/* Footer Actions */}
      <div className="pt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
        <button
          onClick={onReviewChanges}
          className="px-8 py-3.5 glass border-white/10 hover:bg-white/5 text-slate-200 rounded-xl font-bold flex items-center gap-2 transition-all w-full sm:w-auto justify-center"
        >
           Review Changes
        </button>
        <button
          onClick={handleComplete}
          disabled={report?.recommendation !== "SAFE_TO_APPLY" || completing}
          className="px-8 py-3.5 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:text-slate-500 text-white rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg hover:shadow-blue-500/25 w-full sm:w-auto justify-center"
        >
          {completing ? <><Loader2 className="w-5 h-5 animate-spin" /> Applying...</> : <><CheckCircle2 className="w-5 h-5" /> Apply Changes</>}
        </button>
      </div>

    </div>
  );
}

function Activity({ className }: { className?: string }) {
  return <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>;
}
